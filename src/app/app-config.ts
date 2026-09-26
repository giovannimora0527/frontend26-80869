import { HTTP_INTERCEPTORS, provideHttpClient } from "@angular/common/http";
import { ApplicationConfig } from "@angular/core";
import { provideClientHydration } from "@angular/platform-browser";
import { provideAnimations } from "@angular/platform-browser/animations";
import { provideRouter, withEnabledBlockingInitialNavigation, withHashLocation, withInMemoryScrolling, withRouterConfig, withViewTransitions } from "@angular/router";
import { routes } from './app-routing.module';
import { HeadersInterceptor } from "./interceptors/headers.interceptor";

export const appConfig: ApplicationConfig = {
    providers: [
      provideRouter(routes,
        withRouterConfig({
          onSameUrlNavigation: 'reload'
        }),
        withInMemoryScrolling({
          scrollPositionRestoration: 'top',
          anchorScrolling: 'enabled'
        }),
        withEnabledBlockingInitialNavigation(),
        withViewTransitions(),
        withHashLocation()
      ),
      provideHttpClient(),     
      provideAnimations(),
      provideClientHydration(),
      {
        provide: HTTP_INTERCEPTORS,
        useClass: HeadersInterceptor,
        multi: true, // Permite múltiples interceptores
      }
    ]
  };