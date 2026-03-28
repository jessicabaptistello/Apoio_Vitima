import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ApoioComponent } from './apoio';

describe('Apoio', () => {
  let component: ApoioComponent;
  let fixture: ComponentFixture<ApoioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApoioComponent],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(ApoioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});