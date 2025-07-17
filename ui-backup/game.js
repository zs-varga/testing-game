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
        this.updateExecuteButtonState();
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
        container.innerHTML = '';

        if (this.currentSprint) {
            this.currentSprint.testTasks.forEach(task => {
                const taskForm = this.createTestTaskForm(task);
                container.appendChild(taskForm);
            });
            
            // Re-validate all test tasks after rendering
            setTimeout(() => {
                this.validateAllTestTasks();
                this.updateExecuteButtonState();
            }, 0);
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
        // Create a new test task immediately with default values
        const taskId = this.project.getNextId();
        const taskName = 'New Test Task';
        
        // Create with default exploratory type and first available feature (if any)
        const availableFeatures = this.getAvailableFeaturesForTestType('exploratory');
        const defaultFeature = availableFeatures.length > 0 ? [availableFeatures[0]] : [];
        const defaultEffort = this.currentSprint.remainingTestEffort(); // Use remaining effort as default
        
        let testTask = new ExploratoryTestTask(taskId, taskName, this.project, defaultFeature, defaultEffort);
        
        // Add to project backlog and current sprint
        this.project.addToBacklog(testTask);
        this.currentSprint.addTestTask(testTask);
        
        // Only add the new form to the container without re-rendering all forms
        const container = document.getElementById('test-tasks');
        const taskForm = this.createTestTaskForm(testTask);
        container.appendChild(taskForm);
        
        // Update effort counters only
        this.updateEffortCounters();
        
        // Re-validate all test task cards after adding a new one
        this.validateAllTestTasks();
        
        // Update execute button state
        this.updateExecuteButtonState();
    }

    // These methods are no longer needed - test tasks are created immediately
    saveTestTask() {
        // Not used anymore
    }

    cancelTestTask() {
        // Not used anymore
    }

    editTestTask(task, cardElement) {
        // This method is no longer used - test tasks are always in form state
    }

    createTestTaskForm(task) {
        const form = document.createElement('div');
        form.className = 'task-card test-task-form';
        form.dataset.taskId = task.id;

        const currentTestType = task.getType() === 'ExploratoryTestTask' ? 'exploratory' : 'knowledge';

        form.innerHTML = `
            <div class="form-group">
                <label>Action</label>
                <div id="test-type-${task.id}" class="action-checkboxes">
                    <div class="action-checkbox">
                        <input type="radio" id="action-exploratory-${task.id}" name="test-type-${task.id}" value="exploratory" onchange="gameUI.updateTestTaskFeatureOptions(${task.id}); gameUI.autoSaveTestTask(${task.id})" ${currentTestType === 'exploratory' ? 'checked' : ''}>
                        <label for="action-exploratory-${task.id}">Exploratory Testing</label>
                    </div>
                    <div class="action-checkbox">
                        <input type="radio" id="action-knowledge-${task.id}" name="test-type-${task.id}" value="knowledge" onchange="gameUI.updateTestTaskFeatureOptions(${task.id}); gameUI.autoSaveTestTask(${task.id})" ${currentTestType === 'knowledge' ? 'checked' : ''}>
                        <label for="action-knowledge-${task.id}">Knowledge Gathering</label>
                    </div>
                </div>
            </div>
            <div class="form-group">
                <label>Features</label>
                <div id="test-feature-${task.id}" class="feature-checkboxes">
                    <!-- Feature checkboxes will be populated here -->
                </div>
            </div>
            <div class="form-group">
                <label>Effort</label>
                <div class="effort-slider-container">
                    <input type="range" id="test-effort-${task.id}" min="1" max="${this.project.testEffort}" value="${task.size}" onchange="gameUI.autoSaveTestTask(${task.id})" oninput="gameUI.updateEffortDisplay(${task.id})">
                    <span id="effort-display-${task.id}" class="effort-display">${task.size}</span>
                </div>
            </div>
            <div class="form-actions">
                <button class="btn btn-danger" onclick="gameUI.deleteTestTask(${task.id})">Delete</button>
            </div>
            <div class="form-errors" id="form-errors-${task.id}"></div>
        `;

        // Populate the feature checkboxes 
        setTimeout(() => {
            this.updateTestTaskFeatureOptions(task.id);
        }, 0);

        return form;
    }

    updateTestTask(taskId) {
        // This method is no longer used - auto-save handles updates
    }

    deleteTestTask(taskId) {
        // Remove from sprint and project
        const task = this.project.getTaskById(taskId);
        if (task) {
            this.currentSprint._testTasks = this.currentSprint._testTasks.filter(t => t.id !== taskId);
            this.project.removeFromBacklog(taskId);
        }
        
        // Remove only the specific form from the DOM
        const taskForm = document.querySelector(`[data-task-id="${taskId}"]`);
        if (taskForm) {
            taskForm.remove();
        }
        
        // Update effort counters only
        this.updateEffortCounters();
        
        // Re-validate all test task cards after deleting one
        this.validateAllTestTasks();
        
        // Update execute button state
        this.updateExecuteButtonState();
    }

    executeSprint() {
        if (!this.currentSprint || this.currentSprint.isDone()) {
            return;
        }

        // Check for validation errors in test tasks before executing
        if (this.hasTestTaskValidationErrors()) {
            alert('Please fix validation errors in test tasks before executing the sprint.');
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
        
        // Check if there are any remaining (not-done) features or defects in the backlog
        const remainingFeatures = this.project.backlog.filter(task => 
            task.getType() === 'Feature' && !task.isDone()
        );
        const remainingDefects = this.project.backlog.filter(task => 
            task.getType() === 'Defect' && !task.isDone()
        );
        
        // Game ends if there are no not-done features or defects in the backlog
        if (remainingFeatures.length === 0 && remainingDefects.length === 0) {
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
            
            if (testType === 'exploratory') {
                // For exploratory testing, filter old features to only include those that are done
                const validFeatures = oldTask.features.filter(oldFeature => 
                    availableFeatures.some(availFeature => availFeature.id === oldFeature.id)
                );
                
                // If no features from the original selection are done, but there are other done features,
                // recreate the task but with no features selected (user will need to select new ones)
                if (validFeatures.length > 0 || availableFeatures.length > 0) {
                    // Create new test task with same properties
                    const taskId = this.project.getNextId();
                    const featureNames = validFeatures.length > 0 ? validFeatures.map(f => f.name).join(', ') : 'No Features Selected';
                    const taskName = `Exploratory Test - ${featureNames}`;
                    
                    const newTask = new ExploratoryTestTask(taskId, taskName, this.project, validFeatures, oldTask.size);

                    // Add to project backlog
                    this.project.addToBacklog(newTask);
                    newTasks.push(newTask);
                }
            } else {
                // For knowledge gathering, all features in the project are always available
                const validFeatures = oldTask.features.filter(oldFeature => 
                    availableFeatures.some(availFeature => availFeature.id === oldFeature.id)
                );
                
                if (validFeatures.length > 0) {
                    // Create new test task with same properties
                    const taskId = this.project.getNextId();
                    const featureNames = validFeatures.map(f => f.name).join(', ');
                    const taskName = `Knowledge Gathering - ${featureNames}`;
                    
                    const newTask = new GatherKnowledgeTask(taskId, taskName, this.project, validFeatures, oldTask.size);

                    // Add to project backlog
                    this.project.addToBacklog(newTask);
                    newTasks.push(newTask);
                }
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

    // This method is no longer needed
    updateFormFeatureOptions() {
        // Not used anymore
    }

    autoSaveTestTask(taskId) {
        console.log(`autoSaveTestTask called for task ${taskId}`);
        
        const testTypeRadio = document.querySelector(`input[name="test-type-${taskId}"]:checked`);
        const testType = testTypeRadio ? testTypeRadio.value : null;
        const featureContainer = document.getElementById(`test-feature-${taskId}`);
        const effortValue = document.getElementById(`test-effort-${taskId}`).value;
        const errorsDiv = document.getElementById(`form-errors-${taskId}`);

        console.log(`Task ${taskId}: testType=${testType}, featureContainer exists=${!!featureContainer}`);

        // Clear previous errors
        errorsDiv.innerHTML = '';
        errorsDiv.classList.remove('show');

        // Get selected feature IDs from checkboxes - be very specific about which container
        const selectedFeatureIds = Array.from(featureContainer.querySelectorAll('input[type="checkbox"]:checked'))
            .map(checkbox => parseInt(checkbox.value))
            .filter(id => !isNaN(id));

        console.log(`Task ${taskId}: selected features=${selectedFeatureIds}`);

        // Parse effort
        const effort = parseInt(effortValue);

        // Find the task
        const task = this.project.getTaskById(taskId);
        if (!task) {
            console.log(`Task ${taskId}: task not found in project!`);
            return;
        }

        console.log(`Task ${taskId}: current task type=${task.getType()}, current features=${task.features.map(f => f.id)}`);

        // Only validate effort - features are optional for knowledge gathering but required for exploratory
        if (!effortValue || isNaN(effort) || effort <= 0) {
            console.log(`Task ${taskId}: validation failed - invalid effort`);
            errorsDiv.innerHTML = 'Please enter a valid effort amount';
            errorsDiv.classList.add('show');
            this.updateExecuteButtonState();
            return;
        }
        if (effort > this.currentSprint.remainingTestEffort() + task.size) {
            console.log(`Task ${taskId}: validation failed - effort exceeds capacity`);
            errorsDiv.innerHTML = `Effort cannot exceed remaining capacity (${this.currentSprint.remainingTestEffort() + task.size})`;
            errorsDiv.classList.add('show');
            this.updateExecuteButtonState();
            return;
        }
        
        // Validate that exploratory testing has at least one feature selected
        if (testType === 'exploratory' && selectedFeatureIds.length === 0) {
            console.log(`Task ${taskId}: validation failed - exploratory testing requires features`);
            errorsDiv.innerHTML = 'Exploratory testing requires at least one feature to be selected';
            errorsDiv.classList.add('show');
            this.updateExecuteButtonState();
            return;
        }

        console.log(`Task ${taskId}: validation passed`);

        // Find the new features from the appropriate source (empty array is valid)
        const newFeatures = [];
        const availableFeaturesForNewType = this.getAvailableFeaturesForTestType(testType);
        
        console.log(`Task ${taskId}: available features for type ${testType}:`, availableFeaturesForNewType.map(f => `${f.id}:${f.name}`));
        
        for (const featureId of selectedFeatureIds) {
            // Only include features that are actually available for the new test type
            const newFeature = availableFeaturesForNewType.find(f => f.id === featureId);
            if (newFeature) {
                newFeatures.push(newFeature);
                console.log(`Task ${taskId}: including feature ${featureId}:${newFeature.name} in newFeatures`);
            } else {
                console.log(`Task ${taskId}: skipping feature ${featureId} - not available for test type ${testType}`);
            }
        }

        console.log(`Task ${taskId}: found ${newFeatures.length} valid features for new task`);

        // Check if we need to create a new task (type changed) or just update features
        const currentTestType = task.getType() === 'ExploratoryTestTask' ? 'exploratory' : 'knowledge';
        const typeChanged = testType !== currentTestType;

        console.log(`Task ${taskId}: type changed from ${currentTestType} to ${testType}: ${typeChanged}`);

        if (typeChanged) {
            console.log(`Task ${taskId}: type changed from ${currentTestType} to ${testType}, recreating task`);
            // Only recreate task when type changes
            const oldTaskIndex = this.currentSprint._testTasks.findIndex(t => t.id === taskId);
            
            // Remove the old task
            this.currentSprint._testTasks = this.currentSprint._testTasks.filter(t => t.id !== taskId);
            this.project.removeFromBacklog(taskId);

            // Create a new task with updated properties
            const newTaskId = this.project.getNextId();
            const featureNames = newFeatures.length > 0 ? newFeatures.map(f => f.name).join(', ') : 'No Features';
            const taskName = `${testType === 'exploratory' ? 'Exploratory Test' : 'Knowledge Gathering'} - ${featureNames}`;
            
            console.log(`Task ${taskId}: creating new task ${newTaskId} with name "${taskName}" and features [${newFeatures.map(f => f.id).join(',')}]`);
            
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

            console.log(`Task ${taskId}: new task ${newTaskId} created and added to sprint`);

            // Instead of recreating the entire form, just update the radio buttons and trigger feature update
            const oldForm = document.querySelector(`[data-task-id="${taskId}"]`);
            if (oldForm) {
                console.log(`Task ${taskId}: updating DOM elements to use new task ID ${newTaskId}`);
                // Update the form's dataset to the new task ID
                oldForm.dataset.taskId = newTask.id;
                
                // Update radio button names and IDs to match new task ID
                const radioButtons = oldForm.querySelectorAll('input[type="radio"]');
                radioButtons.forEach(radio => {
                    const oldName = radio.name;
                    const oldId = radio.id;
                    radio.name = oldName.replace(taskId, newTask.id);
                    radio.id = oldId.replace(taskId, newTask.id);
                    radio.setAttribute('onchange', `gameUI.updateTestTaskFeatureOptions(${newTask.id}); gameUI.autoSaveTestTask(${newTask.id})`);
                    
                    // Set checked state based on new task type
                    radio.checked = radio.value === testType;
                });
                
                // Update radio button labels
                const radioLabels = oldForm.querySelectorAll('label[for*="action-"]');
                radioLabels.forEach(label => {
                    const oldFor = label.getAttribute('for');
                    label.setAttribute('for', oldFor.replace(taskId, newTask.id));
                });
                
                // Update feature container ID
                const featureContainer = oldForm.querySelector('.feature-checkboxes');
                if (featureContainer) {
                    featureContainer.id = `test-feature-${newTask.id}`;
                }
                
                // Update effort input
                const effortInput = oldForm.querySelector('input[type="range"]');
                if (effortInput) {
                    effortInput.id = `test-effort-${newTask.id}`;
                    effortInput.value = effort;
                    effortInput.setAttribute('onchange', `gameUI.autoSaveTestTask(${newTask.id})`);
                    effortInput.setAttribute('oninput', `gameUI.updateEffortDisplay(${newTask.id})`);
                }
                
                // Update effort display
                const effortDisplay = oldForm.querySelector('.effort-display');
                if (effortDisplay) {
                    effortDisplay.id = `effort-display-${newTask.id}`;
                    effortDisplay.textContent = effort;
                }
                
                // Update delete button
                const deleteButton = oldForm.querySelector('.btn-danger');
                if (deleteButton) {
                    deleteButton.setAttribute('onclick', `gameUI.deleteTestTask(${newTask.id})`);
                }
                
                // Update errors div
                const errorsDiv = oldForm.querySelector('.form-errors');
                if (errorsDiv) {
                    errorsDiv.id = `form-errors-${newTask.id}`;
                }
                
                // Now update the feature options for the new task type
                // Don't call updateTestTaskFeatureOptions here since it was already called from the radio button
                // this.updateTestTaskFeatureOptions(newTask.id);
                
                // Update all feature checkbox onchange attributes to use the new task ID
                // and set the selected features based on what's actually valid for the new task type
                setTimeout(() => {
                    console.log(`Task ${taskId}: updating feature checkboxes for new task ${newTaskId}`);
                    const featureCheckboxes = oldForm.querySelectorAll('.feature-checkboxes input[type="checkbox"]');
                    featureCheckboxes.forEach(checkbox => {
                        checkbox.setAttribute('onchange', `gameUI.autoSaveTestTask(${newTask.id})`);
                    });
                    
                    // Only set features that are actually in the newFeatures array (which are validated for the new task type)
                    newFeatures.forEach(feature => {
                        const checkbox = document.getElementById(`feature-${newTask.id}-${feature.id}`);
                        if (checkbox && !checkbox.disabled) {
                            console.log(`Task ${taskId}: checking feature ${feature.id}:${feature.name} for new task ${newTaskId}`);
                            checkbox.checked = true;
                        } else {
                            console.log(`Task ${taskId}: could not check feature ${feature.id}:${feature.name} for new task ${newTaskId} (checkbox=${!!checkbox}, disabled=${checkbox?.disabled})`);
                        }
                    });
                }, 10);
            }
            
            // Update effort counters only
            this.updateEffortCounters();
            
            // Re-validate all test task cards after any change
            this.validateAllTestTasks();
            
            // Update execute button state since validation passed
            this.updateExecuteButtonState();
        } else {
            console.log(`Task ${taskId}: updating features in place (same type)`);
            
            // Since features property is read-only, we need to recreate the task even when just features change
            const oldTaskIndex = this.currentSprint._testTasks.findIndex(t => t.id === taskId);
            
            // Remove the old task
            this.currentSprint._testTasks = this.currentSprint._testTasks.filter(t => t.id !== taskId);
            this.project.removeFromBacklog(taskId);

            // Create a new task with updated properties (keeping same ID and type)
            const featureNames = newFeatures.length > 0 ? newFeatures.map(f => f.name).join(', ') : 'No Features';
            const taskName = `${testType === 'exploratory' ? 'Exploratory Test' : 'Knowledge Gathering'} - ${featureNames}`;
            
            console.log(`Task ${taskId}: recreating task with same ID and type, new features [${newFeatures.map(f => f.id).join(',')}]`);
            
            let newTask;
            if (testType === 'exploratory') {
                newTask = new ExploratoryTestTask(taskId, taskName, this.project, newFeatures, effort);
            } else {
                newTask = new GatherKnowledgeTask(taskId, taskName, this.project, newFeatures, effort);
            }

            // Add to project backlog
            this.project.addToBacklog(newTask);
            
            // Insert the new task at the same position in the sprint
            if (oldTaskIndex >= 0) {
                this.currentSprint._testTasks.splice(oldTaskIndex, 0, newTask);
            } else {
                this.currentSprint.addTestTask(newTask);
            }
            
            console.log(`Task ${taskId}: task updated with new features`);
            
            // Update effort counters only (no DOM changes needed since ID stays the same)
            this.updateEffortCounters();
            
            // Re-validate all test task cards after any change
            this.validateAllTestTasks();
            
            // Update execute button state since validation passed
            this.updateExecuteButtonState();
        }
    }

    updateTestTaskFeatureOptions(taskId) {
        console.log(`updateTestTaskFeatureOptions called for task ${taskId}`);
        
        const testTypeRadio = document.querySelector(`input[name="test-type-${taskId}"]:checked`);
        const testType = testTypeRadio ? testTypeRadio.value : null;
        const featureContainer = document.getElementById(`test-feature-${taskId}`);
        
        console.log(`Task ${taskId}: current test type = ${testType}`);
        
        if (!featureContainer) {
            console.log(`Task ${taskId}: featureContainer not found`);
            return;
        }
        
        const availableFeatures = this.getAvailableFeaturesForTestType(testType);
        const allFeatures = this.project.backlog.filter(task => task.getType() === 'Feature');
        
        console.log(`Task ${taskId}: available features for ${testType}:`, availableFeatures.map(f => `${f.id}:${f.name}`));
        console.log(`Task ${taskId}: all features in project:`, allFeatures.map(f => `${f.id}:${f.name}(done:${f.isDone()})`));
        
        // Check if checkboxes already exist
        const existingCheckboxes = featureContainer.querySelectorAll('input[type="checkbox"]');
        console.log(`Task ${taskId}: found ${existingCheckboxes.length} existing checkboxes`);
        
        let featuresWereCleared = false;
        
        if (existingCheckboxes.length === 0) {
            console.log(`Task ${taskId}: creating checkboxes for the first time`);
            // No checkboxes exist yet, create them (initial setup)
            if (allFeatures.length === 0) {
                featureContainer.innerHTML = '<div class="no-features">No features in project</div>';
                return;
            }
            
            // Create all checkboxes for the first time
            allFeatures.forEach(feature => {
                const isAvailable = availableFeatures.some(af => af.id === feature.id);
                
                // Find the current task to check if this feature is already selected
                const task = this.project.getTaskById(taskId);
                const isSelected = task && task.features && task.features.some(f => f.id === feature.id);
                
                console.log(`Task ${taskId}: creating checkbox for feature ${feature.id}:${feature.name}, available=${isAvailable}, isSelected=${isSelected}`);
                const checkboxDiv = document.createElement('div');
                checkboxDiv.className = `feature-checkbox${!isAvailable ? ' disabled' : ''}`;
                checkboxDiv.innerHTML = `
                    <input type="checkbox" id="feature-${taskId}-${feature.id}" value="${feature.id}" ${!isAvailable ? 'disabled' : ''} ${isSelected && isAvailable ? 'checked' : ''} onchange="gameUI.autoSaveTestTask(${taskId})">
                    <label for="feature-${taskId}-${feature.id}">${feature.name}</label>
                `;
                featureContainer.appendChild(checkboxDiv);
            });
        } else {
            console.log(`Task ${taskId}: updating existing checkboxes`);
            // Checkboxes exist, just update their availability and state
            const task = this.project.getTaskById(taskId);
            
            allFeatures.forEach(feature => {
                const checkbox = featureContainer.querySelector(`input[value="${feature.id}"]`);
                const checkboxDiv = checkbox ? checkbox.closest('.feature-checkbox') : null;
                
                if (checkbox && checkboxDiv) {
                    const isAvailable = availableFeatures.some(af => af.id === feature.id);
                    const isSelected = task && task.features && task.features.some(f => f.id === feature.id);
                    const wasChecked = checkbox.checked;
                    
                    console.log(`Task ${taskId}: updating feature ${feature.id}:${feature.name}, available=${isAvailable}, isSelected=${isSelected}, wasChecked=${wasChecked}`);
                    
                    // Update disabled state
                    checkbox.disabled = !isAvailable;
                    
                    // Update checked state to match task state (but only if available)
                    if (isAvailable) {
                        checkbox.checked = isSelected;
                    } else {
                        // Uncheck if it becomes unavailable
                        if (checkbox.checked) {
                            checkbox.checked = false;
                            featuresWereCleared = true;
                            console.log(`Task ${taskId}: unchecked feature ${feature.id}:${feature.name} because it became unavailable`);
                        }
                    }
                    
                    // Update CSS class
                    if (isAvailable) {
                        checkboxDiv.classList.remove('disabled');
                    } else {
                        checkboxDiv.classList.add('disabled');
                    }
                }
            });
        }

        console.log(`Task ${taskId}: feature options updated, available features: ${availableFeatures.length}, featuresWereCleared: ${featuresWereCleared}`);
        
        // Re-validate this specific task after updating feature options to clear any stale validation errors
        this.validateSingleTestTask(taskId);
        
        // If we cleared some features due to them becoming unavailable, we don't need to trigger autoSave
        // because the radio button onchange will handle it
        return featuresWereCleared;
    }

    updateEffortDisplay(taskId) {
        const effortSlider = document.getElementById(`test-effort-${taskId}`);
        const effortDisplay = document.getElementById(`effort-display-${taskId}`);
        
        if (effortSlider && effortDisplay) {
            effortDisplay.textContent = effortSlider.value;
        }
    }

    hasTestTaskValidationErrors() {
        // Check if any test task form has validation errors
        const errorDivs = document.querySelectorAll('.form-errors.show');
        return errorDivs.length > 0;
    }

    updateExecuteButtonState() {
        const executeButton = document.getElementById('execute-sprint');
        if (executeButton) {
            const hasErrors = this.hasTestTaskValidationErrors();
            executeButton.disabled = hasErrors;
            
            if (hasErrors) {
                executeButton.title = 'Fix validation errors in test tasks before executing sprint';
            } else {
                executeButton.title = '';
            }
        }
    }

    validateAllTestTasks() {
        // Re-validate all test tasks after any change to ensure capacity constraints are correct
        if (!this.currentSprint) return;
        
        this.currentSprint.testTasks.forEach(task => {
            const taskId = task.id;
            const effortValue = document.getElementById(`test-effort-${taskId}`)?.value;
            const errorsDiv = document.getElementById(`form-errors-${taskId}`);
            
            if (!effortValue || !errorsDiv) return;
            
            // Clear previous errors
            errorsDiv.innerHTML = '';
            errorsDiv.classList.remove('show');
            
            // Parse effort
            const effort = parseInt(effortValue);
            
            // Validate effort
            if (!effortValue || isNaN(effort) || effort <= 0) {
                errorsDiv.innerHTML = 'Please enter a valid effort amount';
                errorsDiv.classList.add('show');
                return;
            }
            
            // Check capacity constraint
            if (effort > this.currentSprint.remainingTestEffort() + task.size) {
                errorsDiv.innerHTML = `Effort cannot exceed remaining capacity (${this.currentSprint.remainingTestEffort() + task.size})`;
                errorsDiv.classList.add('show');
                return;
            }
            
            // Validate that exploratory testing has at least one feature selected
            const testType = task.getType() === 'ExploratoryTestTask' ? 'exploratory' : 'knowledge';
            if (testType === 'exploratory') {
                const featureContainer = document.getElementById(`test-feature-${taskId}`);
                if (featureContainer) {
                    const selectedFeatures = featureContainer.querySelectorAll('input[type="checkbox"]:checked');
                    if (selectedFeatures.length === 0) {
                        errorsDiv.innerHTML = 'Exploratory testing requires at least one feature to be selected';
                        errorsDiv.classList.add('show');
                        return;
                    }
                }
            }
        });
    }

    validateSingleTestTask(taskId) {
        console.log(`validateSingleTestTask called for task ${taskId}`);
        // Validate a single test task to clear stale validation errors when test type changes
        const effortValue = document.getElementById(`test-effort-${taskId}`)?.value;
        const errorsDiv = document.getElementById(`form-errors-${taskId}`);
        
        if (!effortValue || !errorsDiv) {
            console.log(`Task ${taskId}: validation skipped - missing elements`);
            return;
        }
        
        // Clear previous errors
        errorsDiv.innerHTML = '';
        errorsDiv.classList.remove('show');
        
        // Parse effort
        const effort = parseInt(effortValue);
        
        // Get the current test type from the DOM (not from the task object)
        const testTypeRadio = document.querySelector(`input[name="test-type-${taskId}"]:checked`);
        const testType = testTypeRadio ? testTypeRadio.value : null;
        
        console.log(`Task ${taskId}: validating with test type ${testType}, effort ${effort}`);
        
        // Find the task for capacity validation
        const task = this.project.getTaskById(taskId);
        if (!task) {
            console.log(`Task ${taskId}: validation failed - task not found`);
            return;
        }
        
        // Validate effort
        if (!effortValue || isNaN(effort) || effort <= 0) {
            console.log(`Task ${taskId}: validation failed - invalid effort`);
            errorsDiv.innerHTML = 'Please enter a valid effort amount';
            errorsDiv.classList.add('show');
            this.updateExecuteButtonState();
            return;
        }
        
        // Check capacity constraint
        if (effort > this.currentSprint.remainingTestEffort() + task.size) {
            console.log(`Task ${taskId}: validation failed - effort exceeds capacity`);
            errorsDiv.innerHTML = `Effort cannot exceed remaining capacity (${this.currentSprint.remainingTestEffort() + task.size})`;
            errorsDiv.classList.add('show');
            this.updateExecuteButtonState();
            return;
        }
        
        // Validate that exploratory testing has at least one feature selected
        if (testType === 'exploratory') {
            const featureContainer = document.getElementById(`test-feature-${taskId}`);
            if (featureContainer) {
                const selectedFeatures = featureContainer.querySelectorAll('input[type="checkbox"]:checked');
                console.log(`Task ${taskId}: exploratory validation - ${selectedFeatures.length} features selected`);
                if (selectedFeatures.length === 0) {
                    console.log(`Task ${taskId}: validation failed - exploratory requires features`);
                    errorsDiv.innerHTML = 'Exploratory testing requires at least one feature to be selected';
                    errorsDiv.classList.add('show');
                    this.updateExecuteButtonState();
                    return;
                }
            }
        }
        
        console.log(`Task ${taskId}: validation passed`);
        // Update execute button state after validation
        this.updateExecuteButtonState();
    }
}

// Initialize the game when the page loads
window.addEventListener('DOMContentLoaded', () => {
    window.gameUI = new GameUI();
});
