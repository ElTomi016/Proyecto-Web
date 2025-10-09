import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Barcos } from './barcos';

describe('Barcos', () => {
  let component: Barcos;
  let fixture: ComponentFixture<Barcos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Barcos]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Barcos);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
