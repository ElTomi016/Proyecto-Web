import 'zone.js';

import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app';
import { appConfig } from './app/app.config';
import { Router } from '@angular/router';


bootstrapApplication(AppComponent, appConfig)
  .then(ref => {
    // para enlaces <a> sin routerLink
    const router = ref.injector.get(Router);
    (window as any).router = router;
  })
  .catch(err => console.error(err));
