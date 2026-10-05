import { TestBed } from '@angular/core/testing';

import { AnotacionService } from './anotacion.service';

describe('AnotacionService', () => {
  let service: AnotacionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AnotacionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
