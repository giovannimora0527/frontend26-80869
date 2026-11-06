import { enableProdMode, importProvidersFrom } from '@angular/core';

import { environment } from './environments/environment';
import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';

import { AppRoutingModule } from './app/app-routing.module';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app-config';

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, appConfig)
.catch(err => console.error(err));
