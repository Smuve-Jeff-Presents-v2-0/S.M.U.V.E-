import { Injectable, inject, signal, computed } from '@angular/core';
import { UserProfileService } from './user-profile.service';
import {
  ReleaseProject,
  ProductionTrack,
  ReleaseType,
  ReleaseTask,
  ReleaseTaskCategory,
  ReleaseTaskStatus,
} from '../types/release.types';
import { LoggingService } from './logging.service';
import { MarketingService } from './marketing.service';

interface ReleaseKnowledgeBase {
  currentRelease?: ReleaseProject;
}

@Injectable({
  providedIn: 'root',
})
export class ReleasePipelineService {
  private profileService = inject(UserProfileService);
  private logger = inject(LoggingService);
  private marketingService = inject(MarketingService);

  activeRelease = signal<ReleaseProject | null>(null);

  constructor() {
    this.loadActiveRelease();
  }

  private loadActiveRelease() {
    const profile = this.profileService.profile();
    const knowledgeBase = (profile.knowledgeBase || {}) as ReleaseKnowledgeBase;
    const current = knowledgeBase.currentRelease;
    if (current) {
      const hydrated: ReleaseProject = {
        ...current,
        officialTasks: current.officialTasks || this.createOfficialTasks(),
      };
      this.activeRelease.set(hydrated);
    }
  }

  async initializeRelease(name: string, type: ReleaseType): Promise<void> {
    const profile = this.profileService.profile();
    const now = Date.now();
    const newRelease: ReleaseProject = {
      id: `rel-${now}`,
      name,
      type,
      description: '',
      status: 'Planning',
      tracks: [],
      officialTasks: this.createOfficialTasks(),
      credits: {
        artistName: profile.artistName || 'Artist',
        proName: profile.proName,
        proIpi: profile.proIpi,
        collaborators: [],
      },
      createdAt: now,
      updatedAt: now,
    };

    this.activeRelease.set(newRelease);
    await this.saveToProfile(newRelease);
    this.logger.info('ReleasePipeline: Initialized new release', name);
  }

  async addTrack(title: string): Promise<void> {
    const current = this.activeRelease();
    if (!current) return;

    const newTrack: ProductionTrack = {
      id: `trk-${Date.now()}`,
      title,
      status: 'Pending',
      stages: {
        instrumental: 'Pending',
        lyrics: 'Pending',
        vocals: 'Pending',
        mixing: 'Pending',
        mastering: 'Pending',
      },
    };

    const updated = {
      ...current,
      tracks: [...current.tracks, newTrack],
      updatedAt: Date.now(),
    };

    this.activeRelease.set(updated);
    await this.saveToProfile(updated);
  }

  async updateTrackStage(
    trackId: string,
    stage: keyof ProductionTrack['stages'],
    status: ProductionTrack['status']
  ): Promise<void> {
    const current = this.activeRelease();
    if (!current) return;

    const updatedTracks = current.tracks.map((t) => {
      if (t.id === trackId) {
        const newStages = { ...t.stages, [stage]: status };
        const allCompleted = Object.values(newStages).every(
          (s) => s === 'Completed'
        );
        return {
          ...t,
          stages: newStages,
          status: (allCompleted ? 'Completed' : 'In Progress') as any,
        };
      }
      return t;
    });

    const updated = {
      ...current,
      tracks: updatedTracks,
      updatedAt: Date.now(),
    };

    this.activeRelease.set(updated);
    await this.saveToProfile(updated);
  }

  async updateStatus(status: ReleaseProject['status']): Promise<void> {
    const current = this.activeRelease();
    if (!current) return;

    const updated = {
      ...current,
      status,
      updatedAt: Date.now(),
    };

    this.activeRelease.set(updated);
    await this.saveToProfile(updated);

    if (status === 'Released') {
      await this.triggerMarketing();
    }
  }

  async updateOfficialTask(
    taskId: string,
    status: ReleaseTaskStatus
  ): Promise<void> {
    const current = this.activeRelease();
    if (!current) return;

    const updatedTasks = current.officialTasks.map((task) =>
      task.id === taskId ? { ...task, status } : task
    );

    const updatedStatus = this.calculateReleaseStatus(updatedTasks);
    const updated: ReleaseProject = {
      ...current,
      officialTasks: updatedTasks,
      status: updatedStatus,
      updatedAt: Date.now(),
    };

    this.activeRelease.set(updated);
    await this.saveToProfile(updated);

    if (updatedStatus === 'Released') {
      await this.triggerMarketing();
    }
  }

  private calculateReleaseStatus(tasks: ReleaseTask[]): ReleaseProject['status'] {
    const order: ReleaseTaskCategory[] = [
      'Strategy',
      'Production',
      'Visuals',
      'Admin',
      'Distribution',
    ];
    const grouped = order.map((category) => ({
      category,
      tasks: tasks.filter((t) => t.category === category),
    }));

    for (const group of grouped) {
      if (group.tasks.some((t) => t.status !== 'Completed')) {
        switch (group.category) {
          case 'Strategy':
            return 'Planning';
          case 'Production':
            return 'Production';
          case 'Visuals':
            return 'Visuals';
          case 'Admin':
            return 'Admin';
          case 'Distribution':
            return 'Distributing';
        }
      }
    }
    return 'Released';
  }

  private createOfficialTasks(): ReleaseTask[] {
    const tasks: Array<{
      id: string;
      label: string;
      category: ReleaseTaskCategory;
      description: string;
    }> = [
      {
        id: 'strategy-brief',
        label: 'Strategy Brief Locked',
        category: 'Strategy',
        description:
          'Define the album mission, target fanbase, and launch KPIs with S.M.U.V.E.',
      },
      {
        id: 'budget-scope',
        label: 'Budget & Timeline Approved',
        category: 'Strategy',
        description: 'Confirm funding, release window, and risk gates.',
      },
      {
        id: 'talent-acquire',
        label: 'Artists / Producers Secured',
        category: 'Strategy',
        description: 'Lock collaborators and feature requests.',
      },
      {
        id: 'production-tracking',
        label: 'Core Tracking Complete',
        category: 'Production',
        description: 'Instrumentals and vocals recorded to spec.',
      },
      {
        id: 'mixing-complete',
        label: 'Mixes Approved',
        category: 'Production',
        description: 'All stems mixed, QC passed.',
      },
      {
        id: 'mastering',
        label: 'Masters Print-Ready',
        category: 'Production',
        description: 'Final masters rendered with headroom for DSPs.',
      },
      {
        id: 'visuals-cover',
        label: 'Cover Art & Visualizers',
        category: 'Visuals',
        description: 'Artwork, motion loops, and canvas assets delivered.',
      },
      {
        id: 'visuals-merch',
        label: 'Merch Capsule Designed',
        category: 'Visuals',
        description: 'Merch drop graphics aligned to album identity.',
      },
      {
        id: 'admin-pro',
        label: 'PRO Registration + IPI Verified',
        category: 'Admin',
        description: 'Writers/publishers registered, IPI stored.',
      },
      {
        id: 'admin-pub',
        label: 'Publishing Splits & Contracts',
        category: 'Admin',
        description: 'Split sheets, publishing deals, and writer credits signed.',
      },
      {
        id: 'admin-isrc',
        label: 'ISRC/UPC Assigned',
        category: 'Admin',
        description: 'Codes generated and mapped to tracks.',
      },
      {
        id: 'distribution-upload',
        label: 'Distributor Upload',
        category: 'Distribution',
        description: 'Masters, metadata, lyrics, and credits uploaded.',
      },
      {
        id: 'distribution-qc',
        label: 'DSP QC & Loudness Check',
        category: 'Distribution',
        description: 'Preflight loudness, gaps, and artwork compliance.',
      },
      {
        id: 'distribution-schedule',
        label: 'Release Date Scheduled',
        category: 'Distribution',
        description: 'Global release date + preorder configured.',
      },
    ];

    return tasks.map((t) => ({ ...t, status: 'Pending' as ReleaseTaskStatus }));
  }

  private async triggerMarketing() {
    const current = this.activeRelease();
    if (!current) return;

    this.logger.info(
      'ReleasePipeline: Triggering S.M.U.V.E. Marketing Campaign'
    );
    await this.marketingService.createCampaign({
      name: `Global Push: ${current.name}`,
      status: 'Active',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      budget: 1500,
      targetAudience: 'Global',
      goals: ['Streaming Growth', 'Fan Engagement'],
      platforms: ['TikTok', 'Instagram', 'Spotify'],
      strategyLevel: 'Aggressive High Energy',
      metrics: {
        reach: 0,
        impressions: 0,
        engagement: 0,
        conversions: 0,
        spend: 0,
        roi: 0,
        ctr: 0,
        cpc: 0,
      },
    });
  }

  private async saveToProfile(release: ReleaseProject) {
    const profile = this.profileService.profile();
    await this.profileService.updateProfile({
      ...profile,
      knowledgeBase: {
        ...profile.knowledgeBase,
        currentRelease: release,
      } as any,
    });
  }
}
