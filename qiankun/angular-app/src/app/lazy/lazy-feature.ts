import { Component } from '@angular/core';
import { MaterialModule } from '../material.module';

@Component({
  selector: 'app-lazy-feature',
  imports: [MaterialModule],
  templateUrl: './lazy-feature.html',
  styleUrl: './lazy-feature.scss',
})
export class LazyFeatureComponent {
  protected readonly chunkNote = '本模块通过 loadChildren 懒加载，产物中是独立 chunk（lazy-*.js）';
  protected readonly loadTime = new Date().toLocaleTimeString();
}
