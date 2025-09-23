# wizard component
The wizard component is used to guide users through a multi-step process. It provides a clear visual representation of the steps involved and allows users to navigate between them easily.
The wizard will be based on the Modal component. It should use the design system's color palette and typography to ensure consistency with the overall application design.
## Features
- Step navigation: Users can navigate between steps using "Next" and "Previous" buttons.
- Progress indicator: A visual representation of the current step and total steps (optional).
- Validation: Each step can have its own validation logic to ensure that users provide the necessary information before proceeding.
- Customizable buttons: The text and actions of the navigation buttons can be customized for each step.
- Responsive design: The wizard should be fully responsive and work well on different screen sizes.
## Usage
To use the wizard component, import it into your project and define the steps as an array of objects. Each object should contain the content for the step and any specific properties such as validation functions or button text.

for the captions create a prop type, i do not want them all as attributes as in the example
```jsx
import { Wizard, WizardProps } from 'ebag-styles';

const steps = [
  {
    title: 'Step 1',
    content: 'This is the content for step 1',
    validation: () => true,
    nextButtonText: 'Next',
  },
  {
    title: 'Step 2',
    content: 'This is the content for step 2',
    validation: () => true,
    nextButtonText: 'Next',
    previousButtonText: 'Back',
  },
];

const props: WizardProps = {
  nextCaption: 'Next',
  previousCaption: 'Back',
  finishCaption: 'Finish',
};

const MyWizard = () => {
  return (
    <Wizard steps={steps} 
    showProgress={true} 
    {...props} />
  );
};
<Wizard
    steps={steps}
    onComplete={() => {}} 
    onCancel={() => {}}
    showProgress={true}
    {...props}
/>
```