import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModelosComponent } from './modelos';

describe('Modelos', () => {
  let component: ModelosComponent;
  let fixture: ComponentFixture<ModelosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModelosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModelosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
