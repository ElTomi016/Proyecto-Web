import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Modelos } from './modelos';

describe('Modelos', () => {
  let component: Modelos;
  let fixture: ComponentFixture<Modelos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Modelos]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Modelos);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
