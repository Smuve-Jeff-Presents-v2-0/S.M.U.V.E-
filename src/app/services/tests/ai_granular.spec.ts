import { TestBed } from '@angular/core/testing';
import { AiService } from '../ai.service';
import { signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { LoggingService } from '../logging.service';
import { UserContextService } from '../user-context.service';
import { AnalyticsService } from '../analytics.service';
import { UserProfileService } from '../user-profile.service';
import { ReputationService } from '../reputation.service';

describe('AiService Granular Audit', () => {
  let service: AiService;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AiService, provideHttpClient(), provideHttpClientTesting(),
        { provide: LoggingService, useValue: { info: jest.fn(), error: jest.fn(), system: jest.fn() } },
        { provide: UserContextService, useValue: { mainViewMode: signal('hub') } },
        { provide: AnalyticsService, useValue: { overallGrowth: signal(10) } },
        { provide: UserProfileService, useValue: { profile: signal({ careerGoals: [] }) } },
        { provide: ReputationService, useValue: { state: signal({ level: 5 }) } }
      ]
    });
    service = TestBed.inject(AiService);
  });
  it('should exist', () => { expect(service).toBeTruthy(); });
});
