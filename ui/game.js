import { Game } from '../dist/Game.js';
import { Project } from '../dist/Project.js';
import { Feature } from '../dist/Feature.js';
import { Defect } from '../dist/Defect.js';
import { ExploratoryTestTask } from '../dist/TestTask/ExploratoryTestTask.js';
import { GatherKnowledgeTask } from '../dist/TestTask/GatherKnowledgeTask.js';

class GameUI {
    constructor() {
        this.game = new Game();
        this.project = null;
        this.currentSprint = null;
        this.sprintNumber = 1;
        
        this.initializeGame();
        this.bindEvents();
        this.render();
    }

    initializeGame() {
        // Create a project with some initial capacity
        this.project = this.game.createProject(1, 'Test Management Project');
        this.project.devEffort = 10;
        this.project.testEffort = 10;
        
        // Initialize with features
        this.game.initializeProject(this.project);
        
        // Start first sprint
        this.startNewSprint();
    }

    startNewSprint() {
        this.currentSprint = this.project.newSprint();
        this.currentSprint.fillDevSprint();
        this.updateSprintInfo();
    }

    bindEvents() {
        // Tab switching
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => {
                if (!e.target.disabled) {
                    this.switchTab(e.target.dataset.tab);
                }
            });
        });

        // Add test task button
        document.getElementById('add-test-task').addEventListener('click', () => {
            this.addTestTaskForm();
        });

        // Execute sprint button
        document.getElementById('execute-sprint').addEventListener('click', () => {
            this.executeSprint();
        });
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');
    }

    render() {
        this.renderBacklog();
        this.renderCurrentSprint();
        this.renderTestTasks();
        this.renderDoneTasks();
        this.updateEffortCounters();
    }

    renderBacklog() {
        const container = document.getElementById('backlog-tasks');
        container.innerHTML = '';

        const backlogTasks = this.project.backlog.filter(task => 
            !task.isDone() && !this.isTaskInCurrentSprint(task)
        );

        backlogTasks.forEach(task => {
            const card = this.createTaskCard(task);
            container.appendChild(card);
        });
    }

    renderCurrentSprint() {
        const container = document.getElementById('sprint-tasks');
        container.innerHTML = '';

        if (this.currentSprint) {
            this.currentSprint.devTasks.forEach(task => {
                const card = this.createTaskCard(task);
                container.appendChild(card);
            });
        }
    }

    renderTestTasks() {
        const container = document.getElementById('test-tasks');
        // Don't clear existing test task forms, only update saved cards
        const existingForms = container.querySelectorAll('.test-task-form');
        
        // Remove only saved test task cards, keep forms
        container.querySelectorAll('.task-card:not(.test-task-form)').forEach(card => {
            card.remove();
        });

        if (this.currentSprint) {
            this.currentSprint.testTasks.forEach(task => {
                const card = this.createTaskCard(task, true);
                container.appendChild(card);
            });
        }
    }

    renderDoneTasks() {
        const container = document.getElementById('done-tasks');
        container.innerHTML = '';

        // Only display features and defects, not test tasks
        const doneTasks = this.project.backlog.filter(task => 
            task.isDone() && (task.getType() === 'Feature' || task.getType() === 'Defect')
        );

        doneTasks.forEach(task => {
            const card = this.createTaskCard(task);
            container.appendChild(card);
        });
    }

    createTaskCard(task, isTestTask = false) {
        const card = document.createElement('div');
        card.className = `task-card ${task.getType().toLowerCase().replace('task', '-task')}`;
        card.dataset.taskId = task.id;

        if (isTestTask) {
            card.addEventListener('click', () => {
                this.editTestTask(task, card);
            });
        }

        const typeDisplay = task.getType() === 'ExploratoryTestTask' ? 'Exploratory' :
                           task.getType() === 'GatherKnowledgeTask' ? 'Knowledge' :
                           task.getType();

        let taskDetails = '';
        
        if (task.getType() === 'Feature') {
            // Show attributes based on knowledge level
            if (task.knowledge > 0) {
                taskDetails += `<div class="task-detail">Size: ${task.size}</div>`;
            }
            if (task.knowledge > 3) {
                taskDetails += `<div class="task-detail">Complexity: ${task.complexity}</div>`;
            }
        } else if (task.getType() === 'Defect') {
            // Show defect attributes based on knowledge level
            if (task.knowledge > 0) {
                taskDetails += `<div class="task-detail">Size: ${task.size}</div>`;
            }
            if (task.knowledge > 3) {
                taskDetails += `<div class="task-detail">Complexity: ${task.complexity}</div>`;
            }
            taskDetails += `<div class="task-detail">Severity: ${task.severity}</div>`;
        } else {
            // Non-feature/defect tasks show all attributes
            taskDetails += `<div class="task-detail">Size: ${task.size}</div>`;
            taskDetails += `<div class="task-detail">Complexity: ${task.complexity}</div>`;
        }
        
        if (task.getType().includes('TestTask') && task.features) {
            taskDetails += `<div class="task-detail">Features: ${task.features.map(f => f.name).join(', ')}</div>`;
        }

        card.innerHTML = `
            <div class="task-header">
                <div class="task-title">${task.name}</div>
                <div class="task-type ${task.getType().toLowerCase().replace('task', '-task')}">${typeDisplay}</div>
            </div>
            <div class="task-details">
                ${taskDetails}
            </div>
        `;

        return card;
    }

    addTestTaskForm() {
        const container = document.getElementById('test-tasks');
        
        // Check if there's already a form
        if (container.querySelector('.test-task-form')) {
            return;
        }

        const form = document.createElement('div');
        form.className = 'task-card test-task-form';

        form.innerHTML = `
            <div class="form-group">
                <label>Action</label>
                <div id="form-test-type" class="action-checkboxes">
                    <div class="action-checkbox">
                        <input type="radio" id="action-exploratory" name="test-type" value="exploratory" onchange="gameUI.updateFormFeatureOptions()">
                        <label for="action-exploratory">Exploratory Testing</label>
                    </div>
                    <div class="action-checkbox">
                        <input type="radio" id="action-knowledge" name="test-type" value="knowledge" onchange="gameUI.updateFormFeatureOptions()">
                        <label for="action-knowledge">Knowledge Gathering</label>
                    </div>
                </div>
            </div>
            <div class="form-group">
                <label>Features</label>
                <div id="form-test-feature" class="feature-checkboxes">
                    <!-- Feature checkboxes will be populated here -->
                </div>
            </div>
            <div class="form-group">
                <label>Effort</label>
                <input type="number" id="form-test-effort" min="1" max="${this.currentSprint.remainingTestEffort()}" placeholder="Enter effort points">
            </div>
            <div class="form-actions">
                <button class="btn btn-primary" onclick="gameUI.saveTestTask()">Save</button>
                <button class="btn btn-danger" onclick="gameUI.cancelTestTask()">Cancel</button>
            </div>
            <div class="form-errors" id="form-errors"></div>
        `;

        container.appendChild(form);
        
        // Select first action by default
        document.getElementById('action-exploratory').checked = true;
        this.updateFormFeatureOptions();
    }

    saveTestTask() {
        const testTypeRadio = document.querySelector('input[name="test-type"]:checked');
        const testType = testTypeRadio ? testTypeRadio.value : null;
        const featureContainer = document.getElementById('form-test-feature');
        const effortValue = document.getElementById('form-test-effort').value;
        const errorsDiv = document.getElementById('form-errors');

        // Get selected feature IDs from checkboxes
        const selectedFeatureIds = Array.from(featureContainer.querySelectorAll('input[type="checkbox"]:checked'))
            .map(checkbox => parseInt(checkbox.value))
            .filter(id => !isNaN(id));

        // Parse effort
        const effort = parseInt(effortValue);

        // Validation
        const errors = [];
        if (!testType) errors.push('Please select a test type');
        if (selectedFeatureIds.length === 0) errors.push('Please select at least one feature');
        if (!effortValue || isNaN(effort) || effort <= 0) errors.push('Please enter a valid effort amount');
        if (!isNaN(effort) && effort > this.currentSprint.remainingTestEffort()) {
            errors.push(`Effort cannot exceed remaining capacity (${this.currentSprint.remainingTestEffort()})`);
        }

        if (errors.length > 0) {
            errorsDiv.innerHTML = errors.join('<br>');
            errorsDiv.classList.add('show');
            return;
        }

        // Find the features from the appropriate source
        const features = [];
        for (const featureId of selectedFeatureIds) {
            let feature;
            if (testType === 'knowledge') {
                // Knowledge gathering: look in any feature from project backlog
                feature = this.project.backlog.find(task => task.id === featureId && task.getType() === 'Feature');
            } else {
                // Exploratory testing: look in done features
                feature = this.project.backlog.find(task => 
                    task.id === featureId && task.isDone() && task.getType() === 'Feature'
                );
            }
            
            if (!feature) {
                errorsDiv.innerHTML = `Feature with ID ${featureId} not found or not available for this test type`;
                errorsDiv.classList.add('show');
                return;
            }
            features.push(feature);
        }

        // Create the test task
        const taskId = this.project.getNextId();
        const featureNames = features.map(f => f.name).join(', ');
        const taskName = `${testType === 'exploratory' ? 'Exploratory Test' : 'Knowledge Gathering'} - ${featureNames}`;
        
        let testTask;
        if (testType === 'exploratory') {
            testTask = new ExploratoryTestTask(taskId, taskName, this.project, features, effort);
        } else {
            testTask = new GatherKnowledgeTask(taskId, taskName, this.project, features, effort);
        }

        // Add to project backlog and current sprint
        this.project.addToBacklog(testTask);
        this.currentSprint.addTestTask(testTask);

        // Remove the form and re-render
        this.cancelTestTask();
        this.render();
    }

    cancelTestTask() {
        const form = document.querySelector('.test-task-form');
        if (form) {
            form.remove();
        }
    }

    editTestTask(task, cardElement) {
        // Replace the card with an edit form
        const container = cardElement.parentNode;
        const form = document.createElement('div');
        form.className = 'task-card test-task-form';
        form.dataset.editingTaskId = task.id;

        const currentTestType = task.getType() === 'ExploratoryTestTask' ? 'exploratory' : 'knowledge';

        form.innerHTML = `
            <div class="form-group">
                <label>Action</label>
                <div id="edit-test-type-${task.id}" class="action-checkboxes">
                    <div class="action-checkbox">
                        <input type="radio" id="edit-action-exploratory-${task.id}" name="edit-test-type-${task.id}" value="exploratory" onchange="gameUI.updateEditFeatureOptions(${task.id})" ${currentTestType === 'exploratory' ? 'checked' : ''}>
                        <label for="edit-action-exploratory-${task.id}">Exploratory Testing</label>
                    </div>
                    <div class="action-checkbox">
                        <input type="radio" id="edit-action-knowledge-${task.id}" name="edit-test-type-${task.id}" value="knowledge" onchange="gameUI.updateEditFeatureOptions(${task.id})" ${currentTestType === 'knowledge' ? 'checked' : ''}>
                        <label for="edit-action-knowledge-${task.id}">Knowledge Gathering</label>
                    </div>
                </div>
            </div>
            <div class="form-group">
                <label>Features</label>
                <div id="edit-test-feature-${task.id}" class="feature-checkboxes">
                    <!-- Feature checkboxes will be populated here -->
                </div>
            </div>
            <div class="form-group">
                <label>Effort</label>
                <input type="number" id="edit-test-effort-${task.id}" min="1" max="${this.currentSprint.remainingTestEffort() + task.size}" value="${task.size}">
            </div>
            <div class="form-actions">
                <button class="btn btn-primary" onclick="gameUI.updateTestTask(${task.id})">Save</button>
                <button class="btn btn-danger" onclick="gameUI.deleteTestTask(${task.id})">Delete</button>
            </div>
            <div class="form-errors" id="edit-form-errors-${task.id}"></div>
        `;

        container.replaceChild(form, cardElement);
        
        // Populate the feature checkboxes with the correct options and select the current features
        this.updateEditFeatureOptions(task.id);
        const featureContainer = document.getElementById(`edit-test-feature-${task.id}`);
        if (featureContainer && task.features && task.features.length > 0) {
            // Check all current features
            task.features.forEach(feature => {
                const checkbox = featureContainer.querySelector(`input[value="${feature.id}"]`);
                if (checkbox) {
                    checkbox.checked = true;
                }
            });
        }
    }

    updateTestTask(taskId) {
        const testTypeRadio = document.querySelector(`input[name="edit-test-type-${taskId}"]:checked`);
        const testType = testTypeRadio ? testTypeRadio.value : null;
        const featureContainer = document.getElementById(`edit-test-feature-${taskId}`);
        const effortValue = document.getElementById(`edit-test-effort-${taskId}`).value;
        const errorsDiv = document.getElementById(`edit-form-errors-${taskId}`);

        // Get selected feature IDs from checkboxes
        const selectedFeatureIds = Array.from(featureContainer.querySelectorAll('input[type="checkbox"]:checked'))
            .map(checkbox => parseInt(checkbox.value))
            .filter(id => !isNaN(id));

        // Parse effort
        const effort = parseInt(effortValue);

        // Find the task
        const task = this.project.getTaskById(taskId);
        if (!task) return;

        // Validation
        const errors = [];
        if (selectedFeatureIds.length === 0) errors.push('Please select at least one feature');
        if (!effortValue || isNaN(effort) || effort <= 0) errors.push('Please enter a valid effort amount');
        if (!isNaN(effort) && effort > this.currentSprint.remainingTestEffort() + task.size) {
            errors.push(`Effort cannot exceed remaining capacity (${this.currentSprint.remainingTestEffort() + task.size})`);
        }

        if (errors.length > 0) {
            errorsDiv.innerHTML = errors.join('<br>');
            errorsDiv.classList.add('show');
            return;
        }

        // Find the new features from the appropriate source
        const newFeatures = [];
        for (const featureId of selectedFeatureIds) {
            let newFeature;
            if (testType === 'knowledge') {
                // Knowledge gathering: look in any feature from project backlog
                newFeature = this.project.backlog.find(t => t.id === featureId && t.getType() === 'Feature');
            } else {
                // Exploratory testing: look in done features
                newFeature = this.project.backlog.find(t => 
                    t.id === featureId && t.isDone() && t.getType() === 'Feature'
                );
            }
            
            if (!newFeature) {
                errorsDiv.innerHTML = `Feature with ID ${featureId} not found or not available for this test type`;
                errorsDiv.classList.add('show');
                return;
            }
            newFeatures.push(newFeature);
        }

        // Check if we need to create a new task (feature(s) or type changed)
        const currentTestType = task.getType() === 'ExploratoryTestTask' ? 'exploratory' : 'knowledge';
        const currentFeatureIds = task.features.map(f => f.id).sort();
        const newFeatureIds = newFeatures.map(f => f.id).sort();
        const featuresChanged = JSON.stringify(currentFeatureIds) !== JSON.stringify(newFeatureIds);
        const needsNewTask = testType !== currentTestType || featuresChanged;

        if (needsNewTask) {
            // Find the position of the old task to preserve order
            const oldTaskIndex = this.currentSprint._testTasks.findIndex(t => t.id === taskId);
            
            // Remove the old task
            this.currentSprint._testTasks = this.currentSprint._testTasks.filter(t => t.id !== taskId);
            this.project.removeFromBacklog(taskId);

            // Create a new task with updated properties
            const newTaskId = this.project.getNextId();
            const featureNames = newFeatures.map(f => f.name).join(', ');
            const taskName = `${testType === 'exploratory' ? 'Exploratory Test' : 'Knowledge Gathering'} - ${featureNames}`;
            
            let newTask;
            if (testType === 'exploratory') {
                newTask = new ExploratoryTestTask(newTaskId, taskName, this.project, newFeatures, effort);
            } else {
                newTask = new GatherKnowledgeTask(newTaskId, taskName, this.project, newFeatures, effort);
            }

            // Add to project backlog
            this.project.addToBacklog(newTask);
            
            // Insert the new task at the same position in the sprint
            if (oldTaskIndex >= 0) {
                this.currentSprint._testTasks.splice(oldTaskIndex, 0, newTask);
            } else {
                this.currentSprint.addTestTask(newTask);
            }
        } else {
            // Only effort changed, just update the size
            task.size = effort;
        }

        // Always remove any edit forms and re-render
        const editForm = document.querySelector(`[data-editing-task-id="${taskId}"]`);
        if (editForm) {
            editForm.remove();
        }
        this.render();
    }

    deleteTestTask(taskId) {
        // Remove from sprint and project
        const task = this.project.getTaskById(taskId);
        if (task) {
            this.currentSprint._testTasks = this.currentSprint._testTasks.filter(t => t.id !== taskId);
            this.project.removeFromBacklog(taskId);
        }
        this.render();
    }

    executeSprint() {
        if (!this.currentSprint || this.currentSprint.isDone()) {
            return;
        }

        // Store test tasks from current sprint before executing
        const currentTestTasks = [...this.currentSprint.testTasks];
        
        // Count defects before sprint execution
        const defectsBeforeSprint = this.project.backlog.filter(task => task.getType() === 'Defect').length;

        // Execute the sprint
        this.currentSprint.done();
        
        // Count defects after sprint execution
        const defectsAfterSprint = this.project.backlog.filter(task => task.getType() === 'Defect').length;
        const newDefectsCreated = defectsAfterSprint > defectsBeforeSprint;
        
        // Check if all features are developed and no features in current sprint
        const allFeatures = this.project.backlog.filter(task => task.getType() === 'Feature');
        const doneFeatures = allFeatures.filter(task => task.isDone());
        const featuresInCurrentSprint = this.currentSprint.devTasks.filter(task => task.getType() === 'Feature');
        
        // Game ends only if all features are done, no features in sprint, AND no new defects were created
        if (doneFeatures.length === allFeatures.length && featuresInCurrentSprint.length === 0 && !newDefectsCreated) {
            this.endGame();
        } else {
            // Start new sprint
            this.sprintNumber++;
            this.startNewSprint();
            
            // Re-create the same test tasks for the new sprint
            this.recreateTestTasks(currentTestTasks);
        }

        this.render();
    }

    recreateTestTasks(previousTestTasks) {
        // Recreate all valid tasks first, then add them in order
        const newTasks = [];
        
        previousTestTasks.forEach(oldTask => {
            // Check if the features are still available for testing
            const testType = oldTask.getType() === 'ExploratoryTestTask' ? 'exploratory' : 'knowledge';
            const availableFeatures = this.getAvailableFeaturesForTestType(testType);
            
            // Filter old features to only include those still available
            const validFeatures = oldTask.features.filter(oldFeature => 
                availableFeatures.some(availFeature => availFeature.id === oldFeature.id)
            );
            
            if (validFeatures.length > 0) {
                // Create new test task with same properties
                const taskId = this.project.getNextId();
                const featureNames = validFeatures.map(f => f.name).join(', ');
                const taskName = `${testType === 'exploratory' ? 'Exploratory Test' : 'Knowledge Gathering'} - ${featureNames}`;
                
                let newTask;
                if (testType === 'exploratory') {
                    newTask = new ExploratoryTestTask(taskId, taskName, this.project, validFeatures, oldTask.size);
                } else {
                    newTask = new GatherKnowledgeTask(taskId, taskName, this.project, validFeatures, oldTask.size);
                }

                // Add to project backlog
                this.project.addToBacklog(newTask);
                newTasks.push(newTask);
            }
        });
        
        // Add tasks to sprint in order, respecting capacity
        let remainingCapacity = this.currentSprint.remainingTestEffort();
        newTasks.forEach(task => {
            if (task.size <= remainingCapacity) {
                this.currentSprint.addTestTask(task);
                remainingCapacity -= task.size;
            }
        });
    }

    endGame() {
        // Count hidden defects
        const hiddenDefects = this.project.defects.filter(defect => !defect.isFound);
        const totalDefects = this.project.defects.length;
        
        const message = hiddenDefects.length === 0 ? 
            `Congratulations! You found all ${totalDefects} defects!\n\nStarting a new project...` :
            `Game Over! You found ${totalDefects - hiddenDefects.length} out of ${totalDefects} defects. ${hiddenDefects.length} defects remain hidden.\n\nStarting a new project...`;
            
        alert(message);
        
        // Clear all columns and start a new project
        this.startNewProject();
    }

    startNewProject() {
        // Clear the current project
        this.project = null;
        this.currentSprint = null;
        this.sprintNumber = 1;
        
        // Re-enable execute button if it was disabled
        document.getElementById('execute-sprint').disabled = false;
        
        // Initialize a completely new game
        this.initializeGame();
        
        // Re-render everything
        this.render();
    }

    isTaskInCurrentSprint(task) {
        if (!this.currentSprint) return false;
        return this.currentSprint.devTasks.some(t => t.id === task.id) ||
               this.currentSprint.testTasks.some(t => t.id === task.id);
    }

    updateEffortCounters() {
        // Backlog effort
        const backlogTasks = this.project.backlog.filter(task => 
            !task.isDone() && !this.isTaskInCurrentSprint(task)
        );
        const backlogEffort = backlogTasks.reduce((sum, task) => sum + task.size, 0);
        document.getElementById('backlog-effort').textContent = `${backlogEffort} effort`;

        // Sprint effort
        const sprintEffort = this.currentSprint ? 
            this.currentSprint.devTasks.reduce((sum, task) => sum + task.size, 0) : 0;
        document.getElementById('sprint-effort').textContent = `${sprintEffort}/${this.project.devEffort} effort`;

        // Test effort
        const testEffort = this.currentSprint ? 
            this.currentSprint.testTasks.reduce((sum, task) => sum + task.size, 0) : 0;
        const remainingTestEffort = this.currentSprint ? this.currentSprint.remainingTestEffort() : 0;
        document.getElementById('test-effort').textContent = `${testEffort}/${this.project.testEffort} effort (${remainingTestEffort} remaining)`;

        // Done effort
        const doneTasks = this.project.backlog.filter(task => task.isDone());
        const doneEffort = doneTasks.reduce((sum, task) => sum + task.size, 0);
        document.getElementById('done-effort').textContent = `${doneEffort} effort`;
    }

    updateSprintInfo() {
        document.getElementById('sprint-info').textContent = `Sprint ${this.sprintNumber}`;
    }

    // Helper method to get available features based on test type
    getAvailableFeaturesForTestType(testType) {
        if (testType === 'knowledge') {
            // Knowledge gathering can select from ANY feature in the project
            return this.project.backlog.filter(task => task.getType() === 'Feature');
        } else if (testType === 'exploratory') {
            // Exploratory testing can only select from done features
            return this.project.backlog.filter(task => 
                task.isDone() && task.getType() === 'Feature'
            );
        }
        
        return [];
    }

    // Update feature checkbox options when test type changes
    updateFormFeatureOptions() {
        const testTypeRadio = document.querySelector('input[name="test-type"]:checked');
        const testType = testTypeRadio ? testTypeRadio.value : null;
        const featureContainer = document.getElementById('form-test-feature');
        
        if (!featureContainer) return;
        
        const availableFeatures = this.getAvailableFeaturesForTestType(testType);
        const allFeatures = this.project.backlog.filter(task => task.getType() === 'Feature');
        
        // Clear existing checkboxes
        featureContainer.innerHTML = '';
        
        if (allFeatures.length === 0) {
            featureContainer.innerHTML = '<div class="no-features">No features in project</div>';
            return;
        }
        
        // Add checkboxes for all features
        allFeatures.forEach(feature => {
            const isAvailable = availableFeatures.some(af => af.id === feature.id);
            const checkboxDiv = document.createElement('div');
            checkboxDiv.className = `feature-checkbox${!isAvailable ? ' disabled' : ''}`;
            checkboxDiv.innerHTML = `
                <input type="checkbox" id="feature-${feature.id}" value="${feature.id}" ${!isAvailable ? 'disabled' : ''}>
                <label for="feature-${feature.id}">${feature.name}</label>
            `;
            featureContainer.appendChild(checkboxDiv);
        });
    }

    // Update feature checkbox options for edit form
    updateEditFeatureOptions(taskId) {
        const testTypeRadio = document.querySelector(`input[name="edit-test-type-${taskId}"]:checked`);
        const testType = testTypeRadio ? testTypeRadio.value : null;
        const featureContainer = document.getElementById(`edit-test-feature-${taskId}`);
        
        if (!featureContainer) return;
        
        const availableFeatures = this.getAvailableFeaturesForTestType(testType);
        const allFeatures = this.project.backlog.filter(task => task.getType() === 'Feature');
        
        // Clear existing checkboxes
        featureContainer.innerHTML = '';
        
        if (allFeatures.length === 0) {
            featureContainer.innerHTML = '<div class="no-features">No features in project</div>';
            return;
        }
        
        // Add checkboxes for all features
        allFeatures.forEach(feature => {
            const isAvailable = availableFeatures.some(af => af.id === feature.id);
            const checkboxDiv = document.createElement('div');
            checkboxDiv.className = `feature-checkbox${!isAvailable ? ' disabled' : ''}`;
            checkboxDiv.innerHTML = `
                <input type="checkbox" id="edit-feature-${taskId}-${feature.id}" value="${feature.id}" ${!isAvailable ? 'disabled' : ''}>
                <label for="edit-feature-${taskId}-${feature.id}">${feature.name}</label>
            `;
            featureContainer.appendChild(checkboxDiv);
        });
    }
}

// Initialize the game when the page loads
window.addEventListener('DOMContentLoaded', () => {
    window.gameUI = new GameUI();
});
