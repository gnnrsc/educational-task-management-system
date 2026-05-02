# EduTask Manager: Full-Stack Educational Assignment Platform 🎓

A comprehensive web application designed to streamline academic task management, enabling seamless interaction between teachers and students. This project focuses on robust state management, collaborative features, and role-based access control.

## 🚀 Key Features & Technical Highlights

This isn't just a simple to-do list. It implements several advanced web development patterns:

* **Advanced URL-Based State Management**: Unlike standard modals, the "Create Task" flow (2-step process) is managed via URL parameters and `sessionStorage`. This enables **Deep Linking** (opening a specific step via URL) and ensures the state persists even after a page refresh.
* **Concurrent Conflict Resolution**: Implemented a specialized `RisoluzioneConflitti` component to handle real-time collaboration. If two students edit a response simultaneously, the system detects the conflict and allows the user to choose which version to maintain.
* **Role-Based Access Control (RBAC)**: Secure authentication system that dynamically routes users to specialized dashboards based on their role (Teacher vs. Student).
* **Data Analytics Dashboard**: Teachers can monitor class performance through a statistics view with dynamic sorting (alphabetical, grade average, or total tasks).
* **RESTful API Architecture**: A robust backend managing complex relations between users, assignments, and group collaborations.

## 🛠️ Tech Stack

* **Frontend**: React.js, React Router, Bootstrap/CSS3.
* **Backend**: Node.js, Express.js.
* **Database**: SQLite3 (Relational schema for users, tasks, and assignments).
* **Authentication**: Session-based auth with Passport.js logic.

## 📸 Preview

##### Crea compito:

![Crea Compito](./demo/crea_compito.gif)

##### Stato della classe:

![Stato Classe](./demo/stato_classe.jpg)

## ⚙️ Installation & Setup

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/gnnrsc/educational-task-management-system.git
    ```
2.  **Setup Backend**:
    ```bash
    cd server
    npm install
    node server.js
    ```
3.  **Setup Frontend**:
    ```bash
    cd client
    npm install
    npm run dev
    ```

---

## 🏛️ Academic Context

This project was developed as part of the **Web Applications I** course at **Politecnico di Torino** (A.Y. 2024-2025).

**Student**: Giovanna Rosace (s332938)

📄 **[Click here to read the full original exam specifications and API documentation](./SPECIFICATIONS.md)**.
