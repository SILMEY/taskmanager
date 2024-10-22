const apiUrl = 'http://localhost:8080/api/tasks';
const todoColumn = document.getElementById('todoTasks');
const doingColumn = document.getElementById('doingTasks');
const doneColumn = document.getElementById('doneTasks');
const editTaskForm = document.getElementById('editTaskForm');
const taskEditForm = document.getElementById('taskEditForm');
const cancelEditBtn = document.getElementById('cancelEdit');

// Fonction pour récupérer les tâches
function fetchTasks() {
  fetch(apiUrl)
    .then(response => response.json())
    .then(data => {
      todoColumn.innerHTML = '';
      doingColumn.innerHTML = '';
      doneColumn.innerHTML = '';

      data.forEach(task => {
        const taskElement = document.createElement('div');
        taskElement.classList.add('bg-gray-200', 'p-4', 'rounded');
        taskElement.draggable = true;
        taskElement.id = `task-${task.id}`;
        taskElement.setAttribute('ondragstart', 'drag(event)');
        taskElement.setAttribute('data-task-id', task.id);
        taskElement.setAttribute('data-task-title', task.title);
        taskElement.setAttribute('data-task-description', task.description);
        taskElement.setAttribute('data-task-status', task.status);
        taskElement.setAttribute('data-task-user-id', task.user.id);
        taskElement.setAttribute('editTaskVersion', task.version);

        taskElement.innerHTML = `
          <h3 class="font-bold">${task.title}</h3>
          <p>${task.description}</p>
          <p class="text-sm text-gray-500">Utilisateur: ${task.user.username}</p>
        `;

        taskElement.addEventListener('click', () => openEditForm(task));

        if (task.status === 'todo') {
          todoColumn.appendChild(taskElement);
        } else if (task.status === 'doing') {
          doingColumn.appendChild(taskElement);
        } else if (task.status === 'done') {
          doneColumn.appendChild(taskElement);
        }
      });
    });
}

fetchTasks();

function drag(event) {
  event.dataTransfer.setData('text', event.target.id);
}

function allowDrop(event) {
  event.preventDefault();
}

function drop(event) {
  event.preventDefault();
  const taskId = event.dataTransfer.getData('text');
  const taskElement = document.getElementById(taskId);

  // Vérifier si la cible est une colonne, sinon chercher le parent qui est une colonne
  let dropTarget = event.target;
  // Si on dépose sur une autre tâche, on remonte jusqu'à la colonne
  while (!dropTarget.getAttribute('data-status') && dropTarget !== document) {
    dropTarget = dropTarget.parentNode;
  }
  // Si on a trouvé une colonne avec 'data-status', on effectue le dépôt
  if (dropTarget && dropTarget.getAttribute('data-status')) {

    const newStatus = dropTarget.getAttribute('data-status');
    dropTarget.appendChild(taskElement);

    const updatedTask = {
      id: taskElement.getAttribute('data-task-id'),
      title: taskElement.getAttribute('data-task-title'),
      description: taskElement.getAttribute('data-task-description'),
      status: newStatus,
      user: {
        id: taskElement.getAttribute('data-task-user-id')
      },
      version: taskElement.getAttribute('editTaskVersion')  // Inclure la version dans la requête
    };

    updateTask(updatedTask);
  }
}

function updateTask(task) {
  fetch(`${apiUrl}/${task.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(task),
  })
    .then(response => {
      // Vérifier si la réponse est OK (HTTP 200-299)
      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      fetchTasks();
    })
    .catch(error => {
      showErrorModal(error.message); // Afficher la popup en cas d'erreur
      console.error('Erreur lors de la mise à jour de la tâche:', error);
    });
}

function openEditForm(task) {
  // Remplir la liste déroulante des utilisateurs
  //populateUserSelect('editUserId');
  populateUserSelect('editUserId').then(() => {


    editTaskForm.classList.remove('hidden');

    // Remplir le formulaire avec les données de la tâche à modifier
    document.getElementById('editTaskId').value = task.id;
    document.getElementById('editTitle').value = task.title;
    document.getElementById('editDescription').value = task.description;
    document.getElementById('editStatus').value = task.status;
    document.getElementById('editUserId').value = task.user.id; // Sélectionner l'utilisateur actuel
    document.getElementById('editTaskVersion').value = task.version;
  });
}

taskEditForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const taskId = document.getElementById('editTaskId').value;
  const updatedTask = {
    id: taskId,
    title: document.getElementById('editTitle').value,
    description: document.getElementById('editDescription').value,
    status: document.getElementById('editStatus').value,
    user: {
      id: document.getElementById('editUserId').value
    },
    version: document.getElementById('editTaskVersion').value  // Inclure la version dans la requête

  };

  updateTask(updatedTask);

  editTaskForm.classList.add('hidden');
});

cancelEditBtn.addEventListener('click', () => {
  editTaskForm.classList.add('hidden');
});


//pour l'ajout de task
const addTaskBtn = document.getElementById('addTaskBtn');
const addTaskForm = document.getElementById('addTaskForm');
const taskAddForm = document.getElementById('taskAddForm');
const cancelAddBtn = document.getElementById('cancelAdd');

// Ouvrir le formulaire d'ajout de tâche
addTaskBtn.addEventListener('click', () => {
  addTaskForm.classList.remove('hidden');
});

// Soumettre le formulaire d'ajout de tâche
taskAddForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const newTask = {
    title: document.getElementById('addTitle').value,
    description: document.getElementById('addDescription').value,
    status: document.getElementById('addStatus').value,
    user: {
      id: document.getElementById('addUserId').value
    }
  };

  // Envoyer la requête POST pour ajouter la nouvelle tâche
  fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(newTask),
  })
    .then(response => response.json())
    .then(data => {
      fetchTasks(); // Rafraîchir la liste des tâches après l'ajout
      addTaskForm.classList.add('hidden'); // Masquer le formulaire après soumission
    })
    .catch(error => {
      console.error('Erreur lors de l\'ajout de la tâche:', error);
    });
});

// Annuler l'ajout de tâche
cancelAddBtn.addEventListener('click', () => {
  addTaskForm.classList.add('hidden');
});

const addUserBtn = document.getElementById('addUserBtn');
const addUserForm = document.getElementById('addUserForm');
const userAddForm = document.getElementById('userAddForm');
const cancelAddUserBtn = document.getElementById('cancelAddUser');
const apiUrlUsers = 'http://localhost:8080/api/users'; // URL pour le UserController

// Fonction pour remplir la liste des utilisateurs dans le select
function populateUserSelect(selectId) {
  return fetch(apiUrlUsers)
    .then(response => response.json())
    .then(users => {
      const userSelect = document.getElementById(selectId);
      userSelect.innerHTML = ''; // Vider la liste existante

      users.forEach(user => {
        const option = document.createElement('option');
        option.value = user.id;
        option.textContent = user.username;
        userSelect.appendChild(option);
      });
    })
    .catch(error => {
      console.error('Erreur lors de la récupération des utilisateurs:', error);
    });
}

// Ouvrir le formulaire d'ajout d'utilisateur
addUserBtn.addEventListener('click', () => {
  addUserForm.classList.remove('hidden');
});

// Soumettre le formulaire d'ajout d'utilisateur
userAddForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const newUser = {
    username: document.getElementById('addUsername').value,
    email: document.getElementById('addEmail').value
  };

  // Envoyer la requête POST pour ajouter le nouvel utilisateur
  fetch(apiUrlUsers, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(newUser),
  })
    .then(response => response.json())
    .then(data => {
      console.log("Utilisateur ajouté avec succès", data);
      addUserForm.classList.add('hidden'); // Masquer le formulaire après soumission
    })
    .catch(error => {
      console.error('Erreur lors de l\'ajout de l\'utilisateur:', error);
    });
});

// Annuler l'ajout d'utilisateur
cancelAddUserBtn.addEventListener('click', () => {
  addUserForm.classList.add('hidden');
});

function showErrorModal(message) {
  const errorModal = document.getElementById('errorModal');
  const errorMessage = document.getElementById('errorMessage');
  errorMessage.textContent = message; // Afficher le message d'erreur
  errorModal.classList.remove('hidden'); // Montrer la modale
}
const closeErrorModalBtn = document.getElementById('closeErrorModal');
closeErrorModalBtn.addEventListener('click', () => {
  const errorModal = document.getElementById('errorModal');
  errorModal.classList.add('hidden'); // Masquer la modale d'erreur
});



// Appel pour remplir les listes lors de l'affichage des formulaires
document.getElementById('addTaskBtn').addEventListener('click', function () {
  populateUserSelect('addUserId');
  // Affiche le formulaire d'ajout de tâche
  document.getElementById('addTaskForm').classList.remove('hidden');
});



