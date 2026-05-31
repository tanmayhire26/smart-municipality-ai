import { Injectable, NotFoundException, BadRequestException, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Complaint, ComplaintStatus, ComplaintDocument } from './entities/complaint.entity';
import { ComplaintHistory } from './entities/history.entity';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService implements OnModuleInit {
  private readonly logger = new Logger(AppService.name);
  private userServiceUrl: string;
  private aiServiceUrl: string;

  constructor(
    @InjectRepository(Complaint)
    private readonly complaintRepository: Repository<Complaint>,
    @InjectRepository(ComplaintHistory)
    private readonly historyRepository: Repository<ComplaintHistory>,
    private readonly configService: ConfigService
  ) {
    this.userServiceUrl = this.configService.get<string>('USER_SERVICE_URL') || 'http://localhost:3001';
    this.aiServiceUrl = this.configService.get<string>('AI_SERVICE_URL') || 'http://localhost:8000';
  }

  onModuleInit() {
    // Start the auto-escalation check loop (every 60 seconds)
    setInterval(() => {
      this.autoEscalateComplaints().catch(err => {
        this.logger.error(`Error in auto-escalation loop: ${err.message}`);
      });
    }, 60000);
    this.logger.log('Auto-escalation worker initialized.');
  }

  // HTTP Helper to query User Service
  private async fetchFromUserService(path: string, options: RequestInit = {}): Promise<any> {
    try {
      const response = await fetch(`${this.userServiceUrl}${path}`, options);
      if (!response.ok) {
        throw new Error(`User service returned status ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      this.logger.error(`Failed to fetch from user-service: ${(error as Error).message}`);
      throw new Error(`User service communication error: ${(error as Error).message}`);
    }
  }

  // HTTP Helper to call AI Service
  private async callAiService(path: string, payload: any): Promise<any> {
    try {
      const response = await fetch(`${this.aiServiceUrl}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error(`AI service returned status ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      this.logger.error(`Failed to contact AI service: ${(error as Error).message}`);
      throw new Error(`AI service communication error: ${(error as Error).message}`);
    }
  }

  async createComplaint(data: any): Promise<Complaint> {
    const { title, description, category, latitude, longitude, citizenId, photos, videos, documents } = data;

    if (!title || !description || !category || !citizenId) {
      throw new BadRequestException('Title, description, category, and citizenId are required.');
    }

    // 1. Fetch Citizen details from User Service
    const citizen = await this.fetchFromUserService(`/api/users/${citizenId}`);
    if (!citizen) {
      throw new NotFoundException('Citizen user not found.');
    }

    // 2. Fetch Nagarsevak of Citizen's ward from User Service
    let nagarsevakId = null;
    let nagarsevakName = null;
    if (citizen.wardNumber) {
      try {
        const nagarsevaks = await this.fetchFromUserService(`/api/users?role=NAGARSEVAK&wardNumber=${citizen.wardNumber}`);
        if (nagarsevaks && nagarsevaks.length > 0) {
          nagarsevakId = nagarsevaks[0].id;
          nagarsevakName = nagarsevaks[0].name;
        }
      } catch (err) {
        this.logger.warn(`Could not fetch Nagarsevak for ward ${citizen.wardNumber}: ${(err as Error).message}`);
      }
    }

    // 3. Create Complaint
    const complaint = this.complaintRepository.create({
      title,
      description,
      category,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      status: ComplaintStatus.AI_VERIFYING,
      citizenId,
      citizenName: citizen.name,
      wardNumber: citizen.wardNumber || 1,
      unitNumber: citizen.unitNumber || null,
      nagarsevakId,
      nagarsevakName,
      photos: photos || [],
      videos: videos || [],
      documents: documents || [],
    });

    const savedComplaint = await this.complaintRepository.save(complaint);

    // 4. Log Initial History
    await this.logHistory(
      savedComplaint.id,
      null,
      ComplaintStatus.AI_VERIFYING,
      citizenId,
      citizen.name,
      'CITIZEN',
      'Complaint registered. Triggering AI Verification.'
    );

    // 5. Trigger AI Verification asynchronously (background task)
    this.runAiVerification(savedComplaint.id, title, description, category, photos, documents).catch(err => {
      this.logger.error(`AI Verification background error for complaint ${savedComplaint.id}: ${err.message}`);
    });

    return savedComplaint;
  }

  private async runAiVerification(complaintId: string, title: string, description: string, category: string, photos: string[], documents: any[]) {
    this.logger.log(`Running AI verification for complaint: ${complaintId}`);
    const complaint = await this.complaintRepository.findOne({ where: { id: complaintId } });
    if (!complaint) return;

    try {
      const fileUrls = [...(photos || []), ...(documents || []).map(d => d.url)];
      const aiResult = await this.callAiService('/api/ai/verify-complaint', {
        title,
        description,
        category,
        file_urls: fileUrls
      });

      if (aiResult) {
        complaint.aiConfidence = aiResult.confidence;
        complaint.aiSummary = aiResult.summary;
        complaint.aiSuggestedAction = aiResult.suggested_action;
        complaint.aiSeverity = aiResult.severity || 'medium';
        
        if (aiResult.is_genuine) {
          complaint.status = ComplaintStatus.AI_VERIFIED;
          await this.complaintRepository.save(complaint);
          await this.logHistory(
            complaint.id,
            ComplaintStatus.AI_VERIFYING,
            ComplaintStatus.AI_VERIFIED,
            'SYSTEM-AI',
            'AI Verification Engine',
            'SYSTEM',
            `AI verified complaint as genuine (Confidence: ${(aiResult.confidence * 100).toFixed(0)}%, Severity: ${(aiResult.severity || 'medium').toUpperCase()}). Summary: ${aiResult.summary}`
          );
        } else {
          complaint.status = ComplaintStatus.AI_REJECTED;
          await this.complaintRepository.save(complaint);
          await this.logHistory(
            complaint.id,
            ComplaintStatus.AI_VERIFYING,
            ComplaintStatus.AI_REJECTED,
            'SYSTEM-AI',
            'AI Verification Engine',
            'SYSTEM',
            `AI flagged complaint as non-genuine/spam. Summary: ${aiResult.summary}`
          );
        }
      }
    } catch (error) {
      this.logger.error(`AI verification failed for ${complaintId}: ${(error as Error).message}`);
      
      // Fallback: mark as AI_VERIFIED anyway to allow manual flow in MVP if AI service fails/offline
      complaint.status = ComplaintStatus.AI_VERIFIED;
      complaint.aiConfidence = 1.0;
      complaint.aiSummary = 'AI offline. Defaulting to manual verification.';
      complaint.aiSuggestedAction = 'Proceed with Chief Officer inspection.';
      complaint.aiSeverity = 'medium';
      await this.complaintRepository.save(complaint);
      await this.logHistory(
        complaint.id,
        ComplaintStatus.AI_VERIFYING,
        ComplaintStatus.AI_VERIFIED,
        'SYSTEM-AI',
        'AI Verification Engine',
        'SYSTEM',
        'AI service communication failed. Fallback: marked as verified.'
      );
    }
  }

  async assignTask(complaintId: string, data: any): Promise<Complaint> {
    const { workerId, eta, coId } = data;

    if (!workerId || !eta || !coId) {
      throw new BadRequestException('workerId, eta, and coId are required.');
    }

    const complaint = await this.complaintRepository.findOne({ where: { id: complaintId } });
    if (!complaint) {
      throw new NotFoundException('Complaint not found.');
    }

    // Fetch Worker Details
    const worker = await this.fetchFromUserService(`/api/users/${workerId}`);
    if (!worker) {
      throw new NotFoundException('Worker/Subordinate not found.');
    }

    // Fetch CO Details
    const co = await this.fetchFromUserService(`/api/users/${coId}`);
    if (!co) {
      throw new NotFoundException('Chief Officer not found.');
    }

    const oldStatus = complaint.status;
    complaint.status = ComplaintStatus.ASSIGNED;
    complaint.assignedWorkerId = workerId;
    complaint.assignedWorkerName = worker.name;
    complaint.eta = new Date(eta);

    const saved = await this.complaintRepository.save(complaint);

    await this.logHistory(
      complaintId,
      oldStatus,
      ComplaintStatus.ASSIGNED,
      coId,
      co.name,
      'CHIEF_OFFICER',
      `Assigned to worker ${worker.name}. Scheduled resolution ETA: ${new Date(eta).toLocaleDateString()}`
    );

    return saved;
  }

  async investigateSite(complaintId: string, data: any): Promise<Complaint> {
    const { workerId, notes, photos } = data;

    if (!workerId || !notes) {
      throw new BadRequestException('workerId and notes are required.');
    }

    const complaint = await this.complaintRepository.findOne({ where: { id: complaintId } });
    if (!complaint) {
      throw new NotFoundException('Complaint not found.');
    }

    if (complaint.assignedWorkerId !== workerId) {
      throw new BadRequestException('This complaint is not assigned to you.');
    }

    const oldStatus = complaint.status;
    complaint.status = ComplaintStatus.INVESTIGATED;

    // Append investigation photos if provided
    if (photos && photos.length > 0) {
      const docs: ComplaintDocument[] = complaint.documents || [];
      photos.forEach((url: string, index: number) => {
        docs.push({
          type: 'investigation_photo',
          url,
          name: `Investigation Photo ${index + 1}`
        });
      });
      complaint.documents = docs;
    }

    const saved = await this.complaintRepository.save(complaint);

    await this.logHistory(
      complaintId,
      oldStatus,
      ComplaintStatus.INVESTIGATED,
      workerId,
      complaint.assignedWorkerName,
      'WORKER',
      `Site investigation completed. Notes: ${notes}`
    );

    return saved;
  }

  async updateLegalAction(complaintId: string, data: any): Promise<Complaint> {
    const { actorId, actionDetail, documents } = data;

    if (!actorId || !actionDetail) {
      throw new BadRequestException('actorId and actionDetail are required.');
    }

    const complaint = await this.complaintRepository.findOne({ where: { id: complaintId } });
    if (!complaint) {
      throw new NotFoundException('Complaint not found.');
    }

    const actor = await this.fetchFromUserService(`/api/users/${actorId}`);
    if (!actor) {
      throw new NotFoundException('Actor not found.');
    }

    const oldStatus = complaint.status;
    complaint.status = ComplaintStatus.ACTION_TAKEN;

    // Append documents (sale deeds, rebuttal letters, land records)
    if (documents && documents.length > 0) {
      const currentDocs = complaint.documents || [];
      complaint.documents = [...currentDocs, ...documents];
    }

    const saved = await this.complaintRepository.save(complaint);

    await this.logHistory(
      complaintId,
      oldStatus,
      ComplaintStatus.ACTION_TAKEN,
      actorId,
      actor.name,
      actor.role,
      `Legal Action taken / status updated: ${actionDetail}`
    );

    return saved;
  }

  async resolveComplaint(complaintId: string, data: any): Promise<Complaint> {
    const { actorId, resolutionNotes } = data;

    if (!actorId || !resolutionNotes) {
      throw new BadRequestException('actorId and resolutionNotes are required.');
    }

    const complaint = await this.complaintRepository.findOne({ where: { id: complaintId } });
    if (!complaint) {
      throw new NotFoundException('Complaint not found.');
    }

    const actor = await this.fetchFromUserService(`/api/users/${actorId}`);
    if (!actor) {
      throw new NotFoundException('Actor not found.');
    }

    const oldStatus = complaint.status;
    complaint.status = ComplaintStatus.RESOLVED;
    complaint.resolvedAt = new Date();

    const saved = await this.complaintRepository.save(complaint);

    await this.logHistory(
      complaintId,
      oldStatus,
      ComplaintStatus.RESOLVED,
      actorId,
      actor.name,
      actor.role,
      `Complaint resolved. Notes: ${resolutionNotes}`
    );

    return saved;
  }

  async updateSeverity(complaintId: string, data: any): Promise<Complaint> {
    const { actorId, severity } = data;

    if (!actorId || !severity) {
      throw new BadRequestException('actorId and severity are required.');
    }

    const validSeverities = ['low', 'medium', 'high', 'highest'];
    if (!validSeverities.includes(severity.toLowerCase())) {
      throw new BadRequestException(`Invalid severity: ${severity}. Must be one of: low, medium, high, highest`);
    }

    const complaint = await this.complaintRepository.findOne({ where: { id: complaintId } });
    if (!complaint) {
      throw new NotFoundException('Complaint not found.');
    }

    // Fetch Actor Details to check permissions
    const actor = await this.fetchFromUserService(`/api/users/${actorId}`);
    if (!actor) {
      throw new NotFoundException('Actor not found.');
    }

    const role = actor.role.toUpperCase();
    if (role !== 'CHIEF_OFFICER' && role !== 'COLLECTOR') {
      throw new BadRequestException('Only the Chief Officer or District Collector can change severity.');
    }

    const oldSeverity = complaint.aiSeverity || 'unclassified';
    complaint.aiSeverity = severity.toLowerCase();

    const saved = await this.complaintRepository.save(complaint);

    await this.logHistory(
      complaintId,
      complaint.status,
      complaint.status,
      actorId,
      actor.name,
      actor.role,
      `Severity manually updated from ${oldSeverity.toUpperCase()} to ${severity.toUpperCase()} by ${actor.role.replace(/_/g, ' ')}.`
    );

    return saved;
  }

  async getComplaint(id: string): Promise<{ complaint: Complaint; history: ComplaintHistory[] }> {
    const complaint = await this.complaintRepository.findOne({ where: { id } });
    if (!complaint) {
      throw new NotFoundException('Complaint not found.');
    }
    const history = await this.historyRepository.find({
      where: { complaintId: id },
      order: { createdAt: 'ASC' }
    });
    return { complaint, history };
  }

  async getDashboardData(role: string, userId: string, wardNumber?: number): Promise<any> {
    let complaints: Complaint[] = [];

    const r = role.toUpperCase();
    if (r === 'CITIZEN') {
      complaints = await this.complaintRepository.find({
        where: { citizenId: userId },
        order: { createdAt: 'DESC' }
      });
    } else if (r === 'NAGARSEVAK') {
      if (!wardNumber) {
        // Fetch ward from user profile
        const user = await this.fetchFromUserService(`/api/users/${userId}`);
        wardNumber = user.wardNumber;
      }
      complaints = await this.complaintRepository.find({
        where: { wardNumber },
        order: { createdAt: 'DESC' }
      });
    } else if (r === 'WORKER') {
      complaints = await this.complaintRepository.find({
        where: [
          { assignedWorkerId: userId },
          { status: ComplaintStatus.AI_VERIFIED }
        ],
        order: { createdAt: 'DESC' }
      });
    } else if (r === 'COLLECTOR') {
      // Collector sees escalated complaints as priority but can overview all
      complaints = await this.complaintRepository.find({
        order: { status: 'ASC', createdAt: 'DESC' }
      });
    } else if (r === 'CHIEF_OFFICER') {
      complaints = await this.complaintRepository.find({
        order: { createdAt: 'DESC' }
      });
    } else {
      throw new BadRequestException(`Invalid role: ${role}`);
    }

    // Build metrics
    const total = complaints.length;
    const resolved = complaints.filter(c => c.status === ComplaintStatus.RESOLVED).length;
    const active = total - resolved - complaints.filter(c => c.status === ComplaintStatus.AI_REJECTED).length;
    const escalated = complaints.filter(c => c.status === ComplaintStatus.ESCALATED_TO_COLLECTOR).length;
    const pendingVerification = complaints.filter(c => c.status === ComplaintStatus.AI_VERIFYING).length;

    // Ward distribution (for Chief Officer / Collector)
    const wardDistribution: Record<number, number> = {};
    complaints.forEach(c => {
      wardDistribution[c.wardNumber] = (wardDistribution[c.wardNumber] || 0) + 1;
    });

    return {
      complaints,
      metrics: {
        total,
        active,
        resolved,
        escalated,
        pendingVerification
      },
      wardDistribution
    };
  }

  // Trigger manual escalation (useful for quick testing in Demo panel)
  async manualEscalate(complaintId: string): Promise<Complaint> {
    const complaint = await this.complaintRepository.findOne({ where: { id: complaintId } });
    if (!complaint) {
      throw new NotFoundException('Complaint not found.');
    }

    const oldStatus = complaint.status;
    complaint.status = ComplaintStatus.ESCALATED_TO_COLLECTOR;
    complaint.escalatedAt = new Date();

    const saved = await this.complaintRepository.save(complaint);

    await this.logHistory(
      complaintId,
      oldStatus,
      ComplaintStatus.ESCALATED_TO_COLLECTOR,
      'SYSTEM-CRON',
      'Auto-Escalation Worker',
      'SYSTEM',
      'Complaint exceeded resolution time threshold. Automatically escalated to District Collector.'
    );

    return saved;
  }

  // Auto-escalation checks logic
  async autoEscalateComplaints(): Promise<void> {
    const thresholdMinutes = 3; // 3 minutes threshold for easy demo, rather than 7 days
    const cutoffDate = new Date(Date.now() - thresholdMinutes * 60 * 1000);

    // Find complaints raised before the cutoff date that are still REGISTERED, AI_VERIFIED, or ASSIGNED
    const query = this.complaintRepository.createQueryBuilder('complaint')
      .where('complaint.status IN (:...statuses)', { 
        statuses: [ComplaintStatus.REGISTERED, ComplaintStatus.AI_VERIFIED, ComplaintStatus.ASSIGNED] 
      })
      .andWhere('complaint.createdAt < :cutoffDate', { cutoffDate });

    const complaintsToEscalate = await query.getMany();

    if (complaintsToEscalate.length > 0) {
      this.logger.log(`Found ${complaintsToEscalate.length} complaints for auto-escalation.`);
      for (const complaint of complaintsToEscalate) {
        const oldStatus = complaint.status;
        complaint.status = ComplaintStatus.ESCALATED_TO_COLLECTOR;
        complaint.escalatedAt = new Date();
        await this.complaintRepository.save(complaint);
        
        await this.logHistory(
          complaint.id,
          oldStatus,
          ComplaintStatus.ESCALATED_TO_COLLECTOR,
          'SYSTEM-CRON',
          'Auto-Escalation Worker',
          'SYSTEM',
          `Auto-escalation triggered. Resolved status pending for over ${thresholdMinutes} minutes.`
        );
        this.logger.log(`Automatically escalated complaint ${complaint.id} to Collector.`);
      }
    }
  }

  private async logHistory(
    complaintId: string,
    fromStatus: string | null,
    toStatus: string,
    actorId: string | null,
    actorName: string | null,
    actorRole: string | null,
    comment: string
  ): Promise<ComplaintHistory> {
    const history = this.historyRepository.create({
      complaintId,
      fromStatus,
      toStatus,
      actorId,
      actorName,
      actorRole,
      comment,
    });
    return this.historyRepository.save(history);
  }
}
