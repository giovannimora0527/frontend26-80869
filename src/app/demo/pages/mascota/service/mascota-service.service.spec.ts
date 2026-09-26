import { TestBed } from '@angular/core/testing';

import { MascotaServiceService } from './mascota-service.service';

describe('MascotaServiceService', () => {
  let service: MascotaServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MascotaServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
