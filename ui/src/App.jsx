import React, { useEffect, useState } from "react";
import "./App.css";
import { FeatureCard, DefectCard } from "./Card";
import { startGame } from "./game-engine";
import { TestTask } from "../../src/TestTask/TestTask";
import { ExploratoryTestTask } from "../../src/TestTask/ExploratoryTestTask";
import { GatherKnowledgeTask } from "../../src/TestTask/GatherKnowledgeTask";
import { Feature } from "../../src/Feature";

const TABS = [
  { key: "planning", label: "Sprint Planning" },
  { key: "statistics", label: "Statistics" },
];

export default function App() {
  const [activeTab, setActiveTab] = useState("planning");
  const [project, setProject] = useState(null);
  const [features, setFeatures] = useState([]);
  const [devTasks, setDevTasks] = useState([]);
  const [maxDevEffort, setMaxDevEffort] = useState(0);
  const [testEffort, setTestEffort] = useState(10); // default fallback
  const [sprintDone, setSprintDone] = useState(false);
  const [testTasks, setTestTasks] = useState([]);
  // Validation error state from Board
  const [validationError, setValidationError] = useState(false);
  const [showTestEffortModal, setShowTestEffortModal] = useState(false);
  const [pendingSprint, setPendingSprint] = useState(false);
  const [showGameEndModal, setShowGameEndModal] = useState(false);
  const [gameResult, setGameResult] = useState("");

  useEffect(() => {
    const { project, sprint } = startGame();
    setProject(project);
    // Show all items (features and defects) in backlog
    setFeatures(project.backlog);
    setDevTasks(sprint.devTasks);
    setMaxDevEffort(project.devEffort);
    setTestEffort(project.testEffort || 10); // get testEffort from backend
  }, []);

  const handleExecuteSprint = () => {
    const testTasksSumEffort = testTasks.reduce((sum, t) => sum + t.effort, 0);
    if (testTasksSumEffort < testEffort) {
      setShowTestEffortModal(true);
      setPendingSprint(true);
      return;
    }
    executeSprint();
  };

  const executeSprint = () => {
    const currentSprint = project && project.getCurrentSprint();
    setSprintDone(true);

    const sprintHasFeature = currentSprint.devTasks.some(
      (obj) => obj.getType && obj.getType() === "Feature"
    );

    testTasks.forEach((task, idx) => {
      const selectedFeatureObjs = (task.selectedFeatures || [])
        .map((fId) => features.find((f) => f.id === fId))
        .filter(Boolean);
      let testTaskInstance;
      if (task.action === "Exploratory Testing") {
        testTaskInstance = new ExploratoryTestTask(
          project.getNextId(),
          task.action,
          project,
          selectedFeatureObjs,
          task.effort
        );
      } else {
        testTaskInstance = new GatherKnowledgeTask(
          project.getNextId(),
          task.action,
          project,
          selectedFeatureObjs,
          task.effort
        );
      }
      project.backlog.push(testTaskInstance);
      currentSprint.addTestTask(testTaskInstance);
    });

    currentSprint.done();
    setDevTasks([...currentSprint.devTasks]);
    setFeatures(project.backlog);

    // --- GAME ENDING LOGIC ---
    // Check if no feature in sprint and backlog is empty
    const backlogIsEmpty =
      project.backlog.filter((task) => !task.isDone()).length === 0;

    if (!sprintHasFeature && backlogIsEmpty) {
      // Evaluate defects
      const allDefects = project.defects;
      const totalDefects = allDefects.length;
      const notDoneDefects = allDefects.filter(
        (d) => !d.isDone()
      ).length;
      const percentNotDone =
        totalDefects === 0 ? 0 : Math.round((notDoneDefects / totalDefects) * 100);
      
      if (percentNotDone > 10) {
        setGameResult(`You lost! ${percentNotDone}% of defects were not found.`);
      } else {
        setGameResult(`You won! ${percentNotDone}% of defects were not found.`);
      }
      setShowGameEndModal(true);
      return; // Do not create new sprint
    }
    // --- END GAME ENDING LOGIC ---

    // Create and fill new sprint
    const newSprint = project.newSprint();
    newSprint.fillDevSprint();
    setDevTasks([...newSprint.devTasks]);
    setSprintDone(false);
  };

  const handleModalConfirm = () => {
    setShowTestEffortModal(false);
    setPendingSprint(false);
    executeSprint();
  };

  const handleModalCancel = () => {
    setShowTestEffortModal(false);
    setPendingSprint(false);
  };

  const handleStartNewGame = () => {
    const { project, sprint } = startGame();
    setProject(project);
    setFeatures(project.backlog);
    setDevTasks(sprint.devTasks);
    setMaxDevEffort(project.devEffort);
    setTestEffort(project.testEffort || 10);
    setTestTasks([]);
    setSprintDone(false);
    setShowGameEndModal(false);
    setGameResult("");
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Testing Game</h1>
        <div className="sprint-controls">
          <span id="sprint-info">
            Sprint{" "}
            {project && project.getCurrentSprint()
              ? project.getCurrentSprint().id
              : 1}
          </span>
          <button
            className="btn btn-primary"
            onClick={handleExecuteSprint}
            disabled={sprintDone || validationError}
          >
            Execute Sprint
          </button>
        </div>
      </header>

      <div className="tabs">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`tab-button${activeTab === tab.key ? " active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
            disabled={tab.key === "statistics"}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="tab-content-container">
        {activeTab === "planning" && (
          <>
            <Board
              features={features}
              devTasks={devTasks}
              maxDevEffort={maxDevEffort}
              testEffort={testEffort}
              setValidationError={setValidationError}
              testTasks={testTasks}
              setTestTasks={setTestTasks}
            />
            {showTestEffortModal && (
              <div className="modal-overlay">
                <div className="modal">
                  <h3>Test Effort Not Fully Utilized</h3>
                  <p>
                    Test effort is not fully utilized (
                    {testTasks.reduce((sum, t) => sum + t.effort, 0)} /{" "}
                    {testEffort}).
                    <br />
                    Do you want to proceed with sprint execution?
                  </p>
                  <div className="modal-actions">
                    <button
                      className="btn btn-primary"
                      onClick={handleModalConfirm}
                    >
                      Proceed
                    </button>
                    <button className="btn" onClick={handleModalCancel}>
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
            {showGameEndModal && (
              <div className="modal-overlay">
                <div className="modal">
                  <h3>Game Over</h3>
                  <p>{gameResult}</p>
                  <div className="modal-actions">
                    <button
                      className="btn btn-primary"
                      onClick={handleStartNewGame}
                    >
                      Start New Game
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        {activeTab === "statistics" && (
          <div className="tab-content">
            <p>Statistics and past sprints will be available here soon...</p>
          </div>
        )}
      </div>
    </div>
  );
}

function TestTaskCard({ task, onChange, features, idx, testEffort, onDelete }) {
  // Helper: is feature selectable for current action
  const isFeatureSelectable = (feature) => {
    if (task.action === "Knowledge Gathering") return true;
    if (task.action === "Exploratory Testing")
      return feature.isDone && feature.isDone();
    return false;
  };

  // Ensure selectedFeatures is always an array
  const selectedFeatures = Array.isArray(task.selectedFeatures)
    ? task.selectedFeatures
    : [];

  // When changing action, unselect features that become disabled
  const handleActionChange = (newAction) => {
    const newSelectable = features
      .filter((f) => {
        if (newAction === "Knowledge Gathering") return true;
        if (newAction === "Exploratory Testing") return f.isDone && f.isDone();
        return false;
      })
      .map((f) => f.id);
    const filteredSelected = selectedFeatures.filter((id) =>
      newSelectable.includes(id)
    );
    onChange({
      ...task,
      action: newAction,
      selectedFeatures: filteredSelected,
    });
  };

  const handleFeatureToggle = (featureId) => {
    if (selectedFeatures.includes(featureId)) {
      onChange({
        ...task,
        selectedFeatures: selectedFeatures.filter((id) => id !== featureId),
      });
    } else {
      onChange({ ...task, selectedFeatures: [...selectedFeatures, featureId] });
    }
  };

  return (
    <div className="task-card test-task">
      <div className="task-header">
        <span className="task-title test-task-title">Test Task</span>
        <button
          className="delete-task-btn"
          title="Delete Task"
          onClick={onDelete}
        >
          ×
        </button>
      </div>
      <div className="task-details">
        <div className="field-group vertical">
          <label className="field-label">Effort</label>
          <div className="effort-slider-container">
            <input
              type="range"
              min={1}
              max={testEffort}
              value={task.effort}
              onChange={(e) =>
                onChange({ ...task, effort: Number(e.target.value) })
              }
              className="effort-slider"
            />
            <span className="effort-label">{task.effort}</span>
          </div>
        </div>
        <div className="field-group vertical">
          <label className="field-label">Action</label>
          <ul className="action-list">
            <li>
              <label>
                <input
                  type="radio"
                  name={`action-${idx}`}
                  value="Exploratory Testing"
                  checked={task.action === "Exploratory Testing"}
                  onChange={(e) => handleActionChange(e.target.value)}
                />{" "}
                Exploratory Testing
              </label>
            </li>
            <li>
              <label>
                <input
                  type="radio"
                  name={`action-${idx}`}
                  value="Knowledge Gathering"
                  checked={task.action === "Knowledge Gathering"}
                  onChange={(e) => handleActionChange(e.target.value)}
                />{" "}
                Knowledge Gathering
              </label>
            </li>
          </ul>
        </div>
        <div className="feature-multiselect field-group vertical">
          <label className="field-label">Focus</label>
          <ul className="feature-list">
            {features
              .filter((f) => f.getType && f.getType() === "Feature")
              .map((feature) => (
                <li
                  key={feature.id}
                  style={{ opacity: isFeatureSelectable(feature) ? 1 : 0.5 }}
                >
                  <label>
                    <input
                      type="checkbox"
                      checked={selectedFeatures.includes(feature.id)}
                      disabled={!isFeatureSelectable(feature)}
                      onChange={() => handleFeatureToggle(feature.id)}
                    />{" "}
                    {feature.name}
                  </label>
                </li>
              ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Board({
  features = [],
  devTasks = [],
  maxDevEffort = 0,
  testEffort = 10,
  setValidationError,
  testTasks,
  setTestTasks,
}) {
  // Filter backlog: exclude done and current sprint items
  const devTaskIds = new Set(devTasks.map((t) => t.id));
  const backlogCards = features.filter(
    (f) => !(f.isDone && f.isDone()) && !devTaskIds.has(f.id)
  );

  // Only count effort for visible backlog cards
  const backlogEffort = backlogCards.reduce((sum, f) => sum + (f.size || 0), 0);
  // Collect all done features and defects from both features and devTasks
  const doneCards = [
    ...features.filter((f) => f.isDone && f.isDone()),
    ...devTasks.filter((t) => t.isDone && t.isDone()),
  ];

  const handleAddTestTask = () => {
    setTestTasks([
      ...testTasks,
      { action: "Knowledge Gathering", selectedFeatures: [], effort: 1 },
    ]);
  };

  const handleTestTaskChange = (idx, newTask) => {
    const updated = [...testTasks];
    updated[idx] = newTask;
    setTestTasks(updated);
  };

  const handleDeleteTestTask = (idx) => {
    setTestTasks(testTasks.filter((_, i) => i !== idx));
  };

  const testTasksSumEffort = testTasks.reduce((sum, t) => sum + t.effort, 0);
  const isTestEffortExceeded = testTasksSumEffort > testEffort;
  useEffect(() => {
    setValidationError(isTestEffortExceeded);
  }, [isTestEffortExceeded, setValidationError]);

  return (
    <div className="board">
      <Column
        title="Backlog"
        cards={backlogCards.map((f) =>
          f.getType && f.getType() === "Defect" ? (
            <DefectCard
              key={f.id}
              name={f.name}
              size={f.size}
              complexity={f.complexity}
              severity={f.severity}
            />
          ) : (
            <FeatureCard
              key={f.id}
              name={f.name}
              size={f.size}
              complexity={f.complexity}
              knowledge={f.knowledge}
              risks={f.getRisks ? f.getRisks() : []}
            />
          )
        )}
      />
      <Column
        title="Current Sprint"
        cards={devTasks.map((t) =>
          t.getType && t.getType() === "Defect" ? (
            <DefectCard
              key={t.id}
              name={t.name}
              size={t.size}
              complexity={t.complexity}
              severity={t.severity}
            />
          ) : (
            <FeatureCard
              key={t.id}
              name={t.name}
              size={t.size}
              complexity={t.complexity}
              knowledge={t.knowledge}
              risks={t.getRisks ? t.getRisks() : []}
            />
          )
        )}
      />
      <Column
        title="Test Tasks"
        effort={`${testTasksSumEffort} / ${testEffort}`}
        headerButton={<button onClick={handleAddTestTask}>Add</button>}
        cards={testTasks.map((task, idx) => (
          <TestTaskCard
            key={idx}
            task={task}
            onChange={(newTask) => handleTestTaskChange(idx, newTask)}
            features={features}
            idx={idx}
            testEffort={testEffort}
            onDelete={() => handleDeleteTestTask(idx)}
          />
        ))}
        error={isTestEffortExceeded}
      />
      <Column
        title="Done"
        cards={doneCards.filter(item => item.getType && (item.getType() === "Feature" || item.getType() === "Defect")).map((item) =>
          item.getType && item.getType() === "Defect" ? (
            <DefectCard
              key={item.id}
              name={item.name}
              size={item.size}
              complexity={item.complexity}
              severity={item.severity}
            />
          ) : (
            <FeatureCard
              key={item.id}
              name={item.name}
              size={item.size}
              complexity={item.complexity}
              knowledge={item.knowledge}
              risks={item.getRisks ? item.getRisks() : []}
            />
          )
        )}
      />
    </div>
  );
}

function Column({
  title,
  effort = 0,
  cards = [],
  headerButton,
  error,
  children,
}) {
  // Remove effort counter from Backlog, Current Sprint, and Done columns
  const showEffort = title === "Test Tasks";
  return (
    <div className="column">
      <div className="column-header">
        <h3>{title}</h3>
        {showEffort && <span className="effort-sum">{effort} effort</span>}
        {headerButton && <span className="header-btn">{headerButton}</span>}
      </div>
      {error && (
        <div
          style={{
            fontSize: "0.7em",
            textAlign: "left",
            padding: "1em 1.5em",
            background: "rgb(220, 53, 69)",
            color: "#fff",
          }}
        >
          ⚠️ Total test effort exceeds the allowed maximum!
        </div>
      )}
      <div className="column-content">
        {cards.map((card, idx) =>
          card ? React.cloneElement(card, { key: idx }) : null
        )}
        {children}
      </div>
    </div>
  );
}
