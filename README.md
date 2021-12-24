# DcitMovieApp

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 13.1.2.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.

1. Installing angular cli
2. Creating the application -> ng new name_for_project
3. Installing angular material in application -> ng add @angular/material (be in the project directory to run this code) prebuilt theme selected Deep purple/amber, set up global typography (yes), set up browser animations (yes)
4. Create the layout Header, Sidenav, Footer components
5. Go into the project folder and create modules -> ng g m name_of_module
	It's a normal module because it is going to be reused everywhere.
	To lazy load a module use this command -> `ng g m movies --route movies --module app.module`
	After creating modules make sure to remember and import the modules in `app.module.ts`
6. Make sure to go into the component you want and run this command -> `ng g c header` to generate a component of that module.
