import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BarcoForm } from './barco-form';

describe('BarcoForm', () => {
  let component: BarcoForm;
  let fixture: ComponentFixture<BarcoForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BarcoForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BarcoForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
