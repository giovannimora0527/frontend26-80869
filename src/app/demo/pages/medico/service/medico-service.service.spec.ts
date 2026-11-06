import { TestBed } from '@angular/core/testing';

import { MedicoServiceService } from './medico-service.service';

describe('MedicoServiceService', () => {
  let service: MedicoServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MedicoServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
