# DcitMovieApp

The Project is located inside the folder `dcit_movie_app`
To view this Angular Project on your local machine:

- open the command prompt inside dcit_movie_app folder
- run the command `ng serve`
- Open you're browser and navigate to `http://localhost:4200/`, if Angular didn't open a new tab.

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 13.1.2.

## Project Demonstration

Length of time before repeat: 53 seconds

![Project Demonstration](https://github.com/firepenguindisopanda/DCIT-Movie-App/blob/main/readme_assets/website-demonstration.gif)

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).
To get code coverage report run this command `ng test --code-coverage=true`
Screenshot of Unit Test passing.
![Unit Test Using Karma](https://github.com/firepenguindisopanda/DCIT-Movie-App/blob/main/readme_assets/2021-12-26%2022_30_46-Karma.png)

## Code Coverage Report

![Code Coverage Image](https://github.com/firepenguindisopanda/DCIT-Movie-App/blob/main/readme_assets/Code-Coverage.png)

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.

- [x] Installing angular cli
- [x] Creating the application -> ng new name_for_project
- [x] Installing angular material in application -> ng add @angular/material (be in the project directory to run this code) prebuilt theme selected Deep purple/amber, set up global typography (yes), set up browser animations (yes)
- [x] Create the layout Header, Sidenav, Footer components
- [x] Go into the project folder and create modules -> ng g m name_of_module It's a normal module because it is going to be reused everywhere. To lazy load a module use this command -> `ng g m movies --route movies --module app.module` After creating modules make sure to remember and import the modules in `app.module.ts`
- [x] Make sure to go into the component you want and run this command -> `ng g c header` to generate a component of that module. When creating components inside the modules make sure to export the components to gain the ability to use them. Following is an example in the `layout.module.ts`.

### This is an example of code for the layout.module.ts file

```typescript
@NgModule({
	declarations: [
		HeaderComponent,
		FooterComponent,
		SidenavComponent
	],
	imports: [
		CommonModule
	],
	exports: [
		HeaderComponent,
		FooterComponent,
		SidenavComponent
	]
})
```

- [x] Create a module for movies -> `ng g m movies` in the app folder. Create components that will be displayed in this module. Example: `ng g c all-movies` will generate a component I will use to display all the movies from the api.
- [x] Add the component to the `app-routing.module.ts` file.

### Example of adding the component to the app-routing.module.ts

```typescript
	const routes: Routes = [
  	{ path: '', component: AllMoviesComponent}
	];
```
