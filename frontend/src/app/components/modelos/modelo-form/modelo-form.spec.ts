import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModeloForm } from './modelo-form';

describe('ModeloForm', () => {
  let component: ModeloForm;
  let fixture: ComponentFixture<ModeloForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModeloForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModeloForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
