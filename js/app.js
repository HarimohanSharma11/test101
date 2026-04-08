(function() {
    'use strict';

    const STORAGE_KEY = 'todoApp_todos';
    
    let todos = [];
    let currentFilter = 'all';
    let editingId = null;

    let todoForm;
    let todoInput;
    let todoList;
    let todoCount;
    let clearCompletedBtn;
    let filterButtons;

    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).slice(2);
    }

    function loadTodos() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            todos = stored ? JSON.parse(stored) : [];
        } catch (e) {
            todos = [];
            showNotification('Saved data was corrupted and could not be loaded. Starting fresh.', 'error');
        }
    }

    function saveTodos() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
        } catch (e) {
            console.error('Failed to save todos to localStorage');
            showNotification('Failed to save your todos. Storage may be full.', 'error');
        }
    }

    function addTodo(text) {
        const trimmedText = text.trim();
        if (!trimmedText) return;

        const todo = {
            id: generateId(),
            text: trimmedText,
            completed: false,
            createdAt: Date.now()
        };

        todos.unshift(todo);
        saveTodos();
        render();
    }

    function toggleTodo(id) {
        const todo = todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            saveTodos();
            render();
        }
    }

    function deleteTodo(id) {
        todos = todos.filter(t => t.id !== id);
        saveTodos();
        render();
    }

    function editTodo(id, newText) {
        const trimmedText = newText.trim();
        if (!trimmedText) return false;

        const todo = todos.find(t => t.id === id);
        if (todo) {
            todo.text = trimmedText;
            saveTodos();
            return true;
        }
        return false;
    }

    function filterTodos(filter) {
        currentFilter = filter;
        filterButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        render();
    }

    function clearCompleted() {
        todos = todos.filter(t => !t.completed);
        saveTodos();
        render();
    }

    function getFilteredTodos() {
        switch (currentFilter) {
            case 'active':
                return todos.filter(t => !t.completed);
            case 'completed':
                return todos.filter(t => t.completed);
            default:
                return todos;
        }
    }

    function updateTodoCount() {
        const activeCount = todos.filter(t => !t.completed).length;
        const itemWord = activeCount === 1 ? 'item' : 'items';
        todoCount.textContent = `${activeCount} ${itemWord} left`;

        const hasCompleted = todos.some(t => t.completed);
        clearCompletedBtn.disabled = !hasCompleted;
    }

    function createTodoElement(todo) {
        const li = document.createElement('li');
        li.className = `todo-item${todo.completed ? ' completed' : ''}`;
        li.dataset.id = todo.id;

        if (editingId === todo.id) {
            li.innerHTML = `
                <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''}>
                <input type="text" class="todo-text-input" value="${escapeHtml(todo.text)}" aria-label="Edit todo">
                <button class="save-btn" aria-label="Save changes">Save</button>
                <button class="cancel-btn" aria-label="Cancel editing">Cancel</button>
            `;

            const input = li.querySelector('.todo-text-input');
            input.focus();
            input.setSelectionRange(input.value.length, input.value.length);

            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    saveEdit(li, todo.id);
                } else if (e.key === 'Escape') {
                    cancelEdit();
                }
            });

            li.querySelector('.save-btn').addEventListener('click', () => saveEdit(li, todo.id));
            li.querySelector('.cancel-btn').addEventListener('click', cancelEdit);
        } else {
            li.innerHTML = `
                <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''} aria-label="Mark as ${todo.completed ? 'incomplete' : 'complete'}">
                <span class="todo-text">${escapeHtml(todo.text)}</span>
                <div class="todo-actions">
                    <button class="edit-btn" aria-label="Edit todo">Edit</button>
                    <button class="delete-btn" aria-label="Delete todo">Delete</button>
                </div>
            `;

            li.querySelector('.todo-checkbox').addEventListener('change', () => toggleTodo(todo.id));
            li.querySelector('.edit-btn').addEventListener('click', () => startEdit(todo.id));
            li.querySelector('.delete-btn').addEventListener('click', () => deleteTodo(todo.id));
        }

        return li;
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function startEdit(id) {
        editingId = id;
        render();
    }

    function saveEdit(li, id) {
        const input = li.querySelector('.todo-text-input');
        if (editTodo(id, input.value)) {
            editingId = null;
            render();
        }
    }

    function cancelEdit() {
        editingId = null;
        render();
    }

    function render() {
        const filteredTodos = getFilteredTodos();
        
        if (filteredTodos.length === 0) {
            const emptyMessage = currentFilter === 'all' 
                ? 'No todos yet. Add one above!' 
                : currentFilter === 'active' 
                    ? 'No active todos.' 
                    : 'No completed todos.';
            
            todoList.innerHTML = `<li class="empty-state">${emptyMessage}</li>`;
        } else {
            todoList.innerHTML = '';
            filteredTodos.forEach(todo => {
                todoList.appendChild(createTodoElement(todo));
            });
        }

        updateTodoCount();
    }

    function showNotification(message, type) {
        const existing = document.querySelector('.app-notification');
        if (existing) existing.remove();

        const notification = document.createElement('div');
        notification.className = `app-notification app-notification--${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) notification.remove();
        }, 4000);
    }

    function init() {
        todoForm = document.getElementById('todo-form');
        todoInput = document.getElementById('todo-input');
        todoList = document.getElementById('todo-list');
        todoCount = document.getElementById('todo-count');
        clearCompletedBtn = document.getElementById('clear-completed');
        filterButtons = document.querySelectorAll('.filter-btn');

        loadTodos();

        todoForm.addEventListener('submit', (e) => {
            e.preventDefault();
            addTodo(todoInput.value);
            todoInput.value = '';
            todoInput.focus();
        });

        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                filterTodos(btn.dataset.filter);
            });
        });

        clearCompletedBtn.addEventListener('click', clearCompleted);

        render();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();