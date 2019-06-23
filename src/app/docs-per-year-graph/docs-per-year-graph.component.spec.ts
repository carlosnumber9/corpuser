import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DocsPerYearGraphComponent } from './docs-per-year-graph.component';

describe('DocsPerYearGraphComponent', () => {
  let component: DocsPerYearGraphComponent;
  let fixture: ComponentFixture<DocsPerYearGraphComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DocsPerYearGraphComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DocsPerYearGraphComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
