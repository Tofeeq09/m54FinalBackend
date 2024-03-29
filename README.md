# m54FinalBackend

## Researched Technologies

- sequelize - ORM
- express - web framework
- postgres - database
- bcrypt - password hashing
- jsonwebtoken - authentication
- cors - cross-origin resource sharing
- dotenv - environment variables
- nodemon - development server
- morgan - logging
- jest - testing
- supertest - testing
- eslint - linting
- prettier - code formatting
- husky - git hooks
- lint-staged - linting on staged files
- sequelize-cli - sequelize command line interface
- nodemailer - email sending
- multer - file upload
- sharp - image processing
- faker - fake data generation
- axios - http requests
- nodemailer - email sending

## Project Overview

The project aims to develop a highly sophisticated web application that serves as a comprehensive platform for community interaction, event organization, and collaboration. Leveraging modern technologies such as a PostgreSQL database backend server with Node.js and a Vite React frontend, the application seeks to deliver an unparalleled user experience with a wide array of features and functionalities.

- User Authentication and Profile Management
  - Signup and Login
- Group Management
  - Create a Group
- Event Management - Add Event to Group
  -. Interface Features - List Groups and Events - Access Group and Event Details - Join Groups and Events - View Personal Groups and Events
- Admin and Organizer Privileges
  - Disband Group
  - Cancel Event
- Interaction Features
  - Post and Comment in Group and Event Pages

## Project Structure

### User Authentication and Profile Management

1. **Signup and Login:**
   - **Signup Process:**
     - Users begin the signup process by navigating to the registration page, where they are presented with a multi-step form.
     - The registration form collects a range of user data, including username, email address, and password. Each field undergoes client-side validation to ensure correctness and completeness.
     - Upon submission, the backend server receives the form data and processes it. Usernames and email addresses are checked for uniqueness in the database to prevent duplicates.
     - Passwords are securely hashed using industry-standard algorithms like bcrypt to protect user credentials from unauthorized access.
     - Optionally, users can upload a profile photo. The application offers both local file upload and integration with Unsplash API to provide users with a selection of random profile pictures based on their unique user IDs.
     - Error handling mechanisms are in place to provide meaningful feedback to users in case of validation errors or server-side issues.
   - **Login Process:**
     - Registered users access the login page and provide their credentials (email and password).
     - Backend authentication processes validate the provided credentials against the stored user data. If the credentials match, the user is granted access to the application.
     - Session management techniques, such as JSON Web Tokens (JWT) or session cookies, are employed to maintain user sessions securely.

### Group Management

2. **Create a Group**
   - **Creation Process**
     - Authenticated users with appropriate permissions can initiate the creation of a new group through a dedicated interface accessible from the dashboard.
     - The group creation form includes fields for essential group information, such as name, description, and tags. Users can select from predefined tags or create custom ones.
     - Admins have the option to configure privacy settings for the group, such as determining whether it is public, private, or invite-only.
     - Upon submission, the backend processes handle the creation of a new group instance in the database. The initiating user is assigned as the group admin.
     - Asynchronous database transactions ensure data integrity and consistency, with error handling mechanisms in place to address any potential issues during group creation.

### Event Management

3. **Add Event to Group**
   - **Event Creation**
     - Group members, including admins, have the ability to create events within the context of a group. The event creation process is initiated from the group page or a centralized events management section.
     - The event creation form prompts users to provide detailed information about the event, including name, description, date, time, location, and any additional instructions or requirements.
     - Date and time pickers facilitate user input and ensure accuracy by preventing selection of past dates or conflicting time slots.
     - Location input supports various formats, including physical addresses and online platforms, with validation mechanisms to verify correctness.
     - Backend validation processes validate event details, ensuring completeness and consistency before persisting the data to the database.
     - Transactional database operations ensure atomicity and data integrity, with error handling mechanisms to handle exceptional scenarios.

### Interface Features

4. **List Groups and Events**

   - The user interface prominently features lists of groups and events, providing users with easy access to discover and explore community activities.
   - Group and event listings are presented in a visually appealing and intuitive manner, with thumbnail images, titles, and brief descriptions to attract user attention.
   - Advanced filtering and sorting options empower users to refine their search criteria based on various parameters such as relevance, popularity, or date.
   - Pagination or infinite scrolling techniques are employed to manage large datasets efficiently and optimize page load times, ensuring a smooth browsing experience.
   - Real-time updates and notifications alert users to new group creations, event additions, or relevant activities within their communities, enhancing user engagement and retention.

5. **Access Group and Event Details**
   - Detailed group and event pages provide users with comprehensive information about the selected entities, fostering deeper engagement and interaction.
   - Group pages include features such as member lists, recent activities, discussions, administrative controls, and relevant announcements or updates.
   - Event pages display essential event details, such as description, date and time, location map, RSVP options, attendee lists, and discussion threads, enabling users to make informed decisions about event participation.
   - Content organization and navigation are optimized for usability and accessibility, with intuitive layouts and hierarchical structures ensuring a seamless user experience across different devices and screen sizes.
   - Interactive elements such as buttons, forms, and widgets allow users to perform actions such as joining groups, RSVPing to events, posting comments, or initiating discussions directly from the page interface.

### Admin and Organizer Privileges

6. **Disband Group**

   - Group admins are granted exclusive administrative privileges, including the authority to disband their respective groups if necessary.
   - Disbanding a group triggers a series of backend processes to handle data deletion and cleanup operations, ensuring the removal of associated group records, memberships, events, and content.
   - Confirmation prompts and warning messages are displayed to admins to prevent accidental disbandment and provide clarity on the consequences of the action.
   - Audit logs or activity trails may be implemented to track administrative actions and ensure accountability and transparency within the platform.

7. **Cancel Event**
   - Event organizers possess special permissions to manage event-related activities, including the ability to cancel scheduled events if circumstances warrant.
   - Cancelling an event initiates backend processes to update event status, notify registered attendees of the cancellation, and handle any necessary refunds or credits.
   - Communication channels such as email notifications or in-app alerts are utilized to inform attendees about the cancellation reason, alternative arrangements, or next steps.
   - Event cancellation policies and procedures are clearly communicated to organizers and attendees, ensuring alignment with platform guidelines and community expectations.

### Interaction Features

8. **Post and Comment in Group and Event Pages**
   - Posting and commenting functionalities are core features of the application, enabling users to engage in meaningful discussions, share information, and collaborate with others.
   - Rich text editing capabilities provide users with a wide range of formatting options, including text styles, hyperlinks, inline images, and multimedia embedding.
   - Comments are structured in a hierarchical format, allowing for threaded discussions and nested replies, enhancing readability and organization within group and event contexts.
   - Real-time updates and notifications keep users informed of new posts, comments, and interactions, fostering a sense of community and encouraging active participation.
   - Moderation tools and content controls empower group admins and event organizers to manage user-generated content, enforce community guidelines, and ensure a safe and respectful environment for all users.

---

put user
delete user
user join group
get user groups

all group routes
