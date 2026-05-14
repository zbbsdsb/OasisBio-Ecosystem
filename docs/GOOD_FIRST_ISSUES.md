# Good First Issues

Welcome to OasisBio! Here's a list of good first issues to help you get started contributing to the project.

---

## Issue 1: Add Loading States to Flutter Login Page

### Title
Add Loading States to Flutter Login Page

### Description
The Flutter login page currently doesn't show any loading indicator when the user submits their credentials. This makes the user experience worse because they don't know if the app is processing their request.

### Acceptance Criteria
- [ ] Show a circular progress indicator when the login form is being submitted
- [ ] Disable the submit button while loading to prevent duplicate submissions
- [ ] Re-enable the button and hide the indicator when the request completes (success or error)

### Implementation Hints
- Look at `apps/flutter/lib/pages/auth/login_page.dart`
- Use `isLoading` state variable in the login form
- Use Flutter's `CircularProgressIndicator` widget
- Check the `AuthBloc` state to know when loading is happening

---

## Issue 2: Improve Error Messages in Auth Validators

### Title
Improve Error Messages in Auth Validators

### Description
The current error messages in the authentication validators are very technical. We should make them more user-friendly.

### Acceptance Criteria
- [ ] Update email validation error to be clear (e.g., "Please enter a valid email address")
- [ ] Update password/OTP validation errors to be easy to understand
- [ ] Ensure all error messages are consistent in tone

### Implementation Hints
- Look at `packages/common-validators/src/auth-validators.ts`
- Modify the error strings returned by the validation functions
- Test the changes to make sure they still validate correctly

---

## Issue 3: Add Placeholder Images to OasisBio List Items

### Title
Add Placeholder Images to OasisBio List Items

### Description
OasisBio list items in the Flutter app currently don't have any images. Let's add placeholder images to make the UI more visually appealing.

### Acceptance Criteria
- [ ] Add a placeholder image to each OasisBio list item
- [ ] Use the existing logo assets from `assets/images/`
- [ ] Ensure the images are properly sized and aligned

### Implementation Hints
- Look at `apps/flutter/lib/pages/oasisbio/oasisbio_list_page.dart`
- Use Flutter's `Image.asset()` widget
- Check `assets/images/oasis_logo.svg` or `logo_sample.png` for existing assets

---

## Issue 4: Add Keyboard Dismissal on Tap Outside in Flutter

### Title
Add Keyboard Dismissal on Tap Outside in Flutter

### Description
In the Flutter app, when the user taps outside a text field, the keyboard should dismiss automatically.

### Acceptance Criteria
- [ ] Add keyboard dismissal behavior to all form pages (login, create OasisBio, etc.)
- [ ] Ensure tapping anywhere outside a text field dismisses the keyboard
- [ ] Test on both iOS and Android

### Implementation Hints
- Wrap your scaffold body in a `GestureDetector`
- Use `FocusScope.of(context).unfocus()` in the `onTap` callback
- Check existing Flutter pages for examples

---

## Issue 5: Add More Date Formatting Options in common-utils

### Title
Add More Date Formatting Options in common-utils

### Description
The `date.ts` utility in common-utils currently only has basic date formatting. Let's add more options like relative time (e.g., "2 days ago").

### Acceptance Criteria
- [ ] Add a function to format dates as relative time (e.g., "5 minutes ago", "2 days ago")
- [ ] Add a function to format dates in a long format (e.g., "January 1, 2024")
- [ ] Ensure all functions are properly typed with TypeScript
- [ ] Add JSDoc comments for each new function

### Implementation Hints
- Look at `packages/common-utils/src/date.ts`
- Use the existing `date` module as a starting point
- Consider using `Intl.DateTimeFormat` or a lightweight library if needed

---

## Issue 6: Improve Accessibility in Flutter Pages

### Title
Improve Accessibility in Flutter Pages

### Description
The Flutter app should be more accessible. Let's add semantic labels and improve contrast ratios.

### Acceptance Criteria
- [ ] Add semantic labels to all buttons and interactive elements
- [ ] Ensure text has sufficient contrast against backgrounds
- [ ] Test with screen readers if possible

### Implementation Hints
- Use Flutter's `Semantics` widget or `semanticsLabel` property
- Check Material Design 3 accessibility guidelines
- Look at `apps/flutter/lib/pages/` for existing pages

---

## Issue 7: Add Unit Tests for common-utils

### Title
Add Unit Tests for common-utils

### Description
The `common-utils` package doesn't have any unit tests yet. Let's add tests for all utility functions.

### Acceptance Criteria
- [ ] Add unit tests for `string.ts` functions
- [ ] Add unit tests for `date.ts` functions
- [ ] Add unit tests for `validation.ts` functions
- [ ] Ensure all tests pass

### Implementation Hints
- Look at `packages/common-utils/src/` for the utility files
- Choose a test framework (Jest is a good choice for TypeScript)
- Check `package.json` for existing test scripts

---

## Issue 8: Add Confirmation Dialog Before Deleting OasisBio

### Title
Add Confirmation Dialog Before Deleting OasisBio

### Description
When a user tries to delete an OasisBio, we should show a confirmation dialog to prevent accidental deletions.

### Acceptance Criteria
- [ ] Show a confirmation dialog when the delete button is pressed
- [ ] Only proceed with deletion if the user confirms
- [ ] Cancel the deletion if the user clicks "No" or closes the dialog

### Implementation Hints
- Look at `apps/flutter/lib/pages/oasisbio/oasisbio_detail_page.dart`
- Use Flutter's `showDialog()` function with `AlertDialog`
- Check `OasisBioBloc` for the delete event

---

## Issue 9: Update README with Screenshots

### Title
Update README with Screenshots

### Description
The project README is missing screenshots of the Flutter app. Let's add some screenshots to make it more engaging.

### Acceptance Criteria
- [ ] Add screenshots of the login page
- [ ] Add screenshots of the dashboard
- [ ] Add screenshots of the OasisBio list and detail pages
- [ ] Update the README to include these screenshots

### Implementation Hints
- Run the Flutter app and take screenshots
- Save screenshots to `assets/images/`
- Update `README.md` (root or `docs/README.md`) to include them

---

## Issue 10: Add Input Validation to OasisBio Create Form

### Title
Add Input Validation to OasisBio Create Form

### Description
The OasisBio create form in the Flutter app doesn't have proper input validation. Let's add validation using the existing `common-validators` package.

### Acceptance Criteria
- [ ] Validate that the title is not empty
- [ ] Validate that the slug is in the correct format
- [ ] Show error messages below invalid fields
- [ ] Disable submit button until all fields are valid

### Implementation Hints
- Look at `apps/flutter/lib/pages/oasisbio/oasisbio_create_page.dart`
- Use the validators from `packages/common-validators/`
- Check `apps/flutter/lib/services/` for how to connect to validators

---

## Issue 11: Improve Logging in common-utils

### Title
Improve Logging in common-utils

### Description
The logger utility in `common-utils` is very basic. Let's add log levels (info, warn, error) and better formatting.

### Acceptance Criteria
- [ ] Add log levels (debug, info, warn, error)
- [ ] Add timestamps to log messages
- [ ] Add optional metadata support
- [ ] Update existing code to use the new logger features

### Implementation Hints
- Look at `packages/common-utils/src/logger.ts`
- Define a log level enum
- Modify the logger class to support levels and timestamps

---

## Issue 12: Add Dark Mode Support to Flutter App

### Title
Add Dark Mode Support to Flutter App

### Description
The Flutter app currently only supports light mode. Let's add dark mode support.

### Acceptance Criteria
- [ ] Add dark mode theme to the app
- [ ] Allow users to switch between light and dark mode
- [ ] Persist the user's theme preference
- [ ] Ensure all UI elements look good in both modes

### Implementation Hints
- Look at `apps/flutter/lib/app.dart`
- Use Flutter's `ThemeMode` and `shared_preferences`
- Define light and dark themes in the app's theme data
