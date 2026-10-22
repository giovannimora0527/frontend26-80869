import { TestBed } from '@angular/core/testing';

import { MedicosServiceService } from './medicos-service.service';

describe('MedicosServiceService', () => {
  let service: MedicosServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MedicosServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
