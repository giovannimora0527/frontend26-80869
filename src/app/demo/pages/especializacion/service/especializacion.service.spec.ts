import { TestBed } from '@angular/core/testing';

import { EspecializacionService } from './especializacion.service';

describe('EspecializacionService', () => {
  let service: EspecializacionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EspecializacionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
