import React, { useEffect, useState } from "react";
import "./App.css";
import { FeatureCard, DefectCard } from "./Card";
import { startGame, startSprint } from "./game-engine";

const TABS = [
  { key: "planning", label: "Sprint Planning" },
  { key: "statistics", label: "Statistics" },
];

export default function App() {
  const [activeTab, setActiveTab] = useState("planning");
  const [features, setFeatures] = useState([]);
  const [devTasks, setDevTasks] = useState([]);
  const [maxDevEffort, setMaxDevEffort] = useState(0);
  const [testEffort, setTestEffort] = useState(10); // default fallback
  const [sprintObj, setSprintObj] = useState(null);
  const [sprintDone, setSprintDone] = useState(false);
  // Validation error state from Board
  const [validationError, setValidationError] = useState(false);

  useEffect(() => {
    const { project, sprint } = startGame();
    const featureList = project.backlog.filter(
      (item) => item.getType && item.getType() === "Feature"
    );
    setFeatures(featureList);
    setDevTasks(sprint.devTasks);
    setMaxDevEffort(project.devEffort);
    setTestEffort(project.testEffort || 10); // get testEffort from backend
    setSprintObj(sprint);
  }, []);

  const handleExecuteSprint = () => {
    if (sprintObj && !sprintDone) {
      sprintObj.done();
      setSprintDone(true);
      setDevTasks([...sprintObj.devTasks]); // update tasks for done sprint

      // Create and fill new sprint
      const newSprint = sprintObj.project.newSprint();
      newSprint.fillDevSprint();
      setSprintObj(newSprint);
      setDevTasks([...newSprint.devTasks]);
      setSprintDone(false); // allow execution of next sprint
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Testing Game</h1>
        <div className="sprint-controls">
          <span id="sprint-info">Sprint {sprintObj ? sprintObj.id : 1}</span>
          <button className="btn btn-primary" onClick={handleExecuteSprint} disabled={sprintDone || validationError}>
            Execute Sprint
          </button>
        </div>
      </header>

      <div className="tabs">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`tab-button${
              activeTab === tab.key ? " active" : ""
            }`}
            onClick={() => setActiveTab(tab.key)}
            disabled={tab.key === "statistics"}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="tab-content-container">
        {activeTab === "planning" && <Board features={features} devTasks={devTasks} maxDevEffort={maxDevEffort} testEffort={testEffort} setValidationError={setValidationError} />}
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
    if (task.action === "Exploratory Testing") return feature.isDone && feature.isDone();
    return false;
  };

  // Ensure selectedFeatures is always an array
  const selectedFeatures = Array.isArray(task.selectedFeatures) ? task.selectedFeatures : [];

  // When changing action, unselect features that become disabled
  const handleActionChange = (newAction) => {
    const newSelectable = features.filter(f => {
      if (newAction === "Knowledge Gathering") return true;
      if (newAction === "Exploratory Testing") return f.isDone && f.isDone();
      return false;
    }).map(f => f.id);
    const filteredSelected = selectedFeatures.filter(id => newSelectable.includes(id));
    onChange({ ...task, action: newAction, selectedFeatures: filteredSelected });
  };

  const handleFeatureToggle = (featureId) => {
    if (selectedFeatures.includes(featureId)) {
      onChange({ ...task, selectedFeatures: selectedFeatures.filter(id => id !== featureId) });
    } else {
      onChange({ ...task, selectedFeatures: [...selectedFeatures, featureId] });
    }
  };

  return (
    <div className="task-card test-task">
      <div className="task-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: 0, marginBottom: 0 }}>
        <span style={{ fontWeight: 600, color: '#333', fontSize: '0.9rem', lineHeight: 1.3, display: 'flex', alignItems: 'center', height: '28px' }}>Test Task</span>
        <button
          className="delete-task-btn"
          title="Delete Task"
          style={{ background: 'none', border: 'none', color: '#dc3545', fontSize: '1.1em', cursor: 'pointer', padding: '2px 8px', borderRadius: '50%', marginLeft: 'auto', height: '28px', display: 'flex', alignItems: 'center' }}
          onClick={onDelete}
        >
          ×
        </button>
      </div>
      <div className="task-details">
        <div className="field-group vertical">
          <label className="field-label">Effort</label>
          <div className="effort-slider-container" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '12px', width: '100%' }}>
            <input
              type="range"
              min={1}
              max={testEffort}
              value={task.effort}
              onChange={e => onChange({ ...task, effort: Number(e.target.value) })}
              className="effort-slider"
              style={{ width: '90%', maxWidth: '220px', accentColor: '#3366ff' }}
            />
            <span className="effort-label" style={{ color: '#3366ff', fontWeight: 'bold', minWidth: '15px', textAlign: 'center'}}>{task.effort}</span>
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
                  onChange={e => handleActionChange(e.target.value)}
                /> Exploratory Testing
              </label>
            </li>
            <li>
              <label>
                <input
                  type="radio"
                  name={`action-${idx}`}
                  value="Knowledge Gathering"
                  checked={task.action === "Knowledge Gathering"}
                  onChange={e => handleActionChange(e.target.value)}
                /> Knowledge Gathering
              </label>
            </li>
          </ul>
        </div>
        <div className="feature-multiselect field-group vertical">
          <label className="field-label">Focus</label>
          <ul className="feature-list">
            {features.map(feature => (
              <li key={feature.id} style={{ opacity: isFeatureSelectable(feature) ? 1 : 0.5 }}>
                <label>
                  <input
                    type="checkbox"
                    checked={selectedFeatures.includes(feature.id)}
                    disabled={!isFeatureSelectable(feature)}
                    onChange={() => handleFeatureToggle(feature.id)}
                  /> {feature.name}
                </label>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Board({ features = [], devTasks = [], maxDevEffort = 0, testEffort = 10, setValidationError }) {
  const [testTasks, setTestTasks] = useState([]);

  const backlogEffort = features.reduce((sum, f) => sum + (f.size || 0), 0);
  const devEffort = devTasks.reduce((sum, t) => sum + (t.size || 0), 0);

  // Collect all done features and defects from both features and devTasks
  const doneCards = [
    ...features.filter(f => f.isDone && f.isDone()),
    ...devTasks.filter(t => t.isDone && t.isDone())
  ];

  // Filter backlog: exclude done and current sprint items
  const devTaskIds = new Set(devTasks.map(t => t.id));
  const backlogCards = features.filter(f =>
    !(f.isDone && f.isDone()) && !devTaskIds.has(f.id)
  );

  const handleAddTestTask = () => {
    setTestTasks([...testTasks, { action: "Knowledge Gathering", selectedFeatures: [], effort: 1 }]);
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
        effort={backlogEffort}
        cards={backlogCards.map((f) => (
          <FeatureCard key={f.id} name={f.name} size={f.size} complexity={f.complexity} />
        ))}
      />
      <Column
        title="Current Sprint"
        effort={`${devEffort} / ${maxDevEffort}`}
        cards={devTasks.map((t) =>
          t.getType && t.getType() === "Defect"
            ? <DefectCard key={t.id} name={t.name} size={t.size} complexity={t.complexity} severity={t.severity} />
            : <FeatureCard key={t.id} name={t.name} size={t.size} complexity={t.complexity} />
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
            onChange={newTask => handleTestTaskChange(idx, newTask)}
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
        effort={doneCards.length}
        cards={doneCards.map((item) =>
          item.getType && item.getType() === "Defect"
            ? <DefectCard key={item.id} name={item.name} size={item.size} complexity={item.complexity} severity={item.severity} />
            : <FeatureCard key={item.id} name={item.name} size={item.size} complexity={item.complexity} />
        )}
      />
    </div>
  );
}

function Column({ title, effort = 0, cards = [], headerButton, error, children }) {
  return (
    <div className="column">
      <div className="column-header">
        <h3>{title}</h3>
        <span className="effort-sum">{effort} effort</span>
        {headerButton && <span className="header-btn">{headerButton}</span>}
      </div>
      {error && (
        <div style={{ fontSize: '0.7em', textAlign: 'left', padding: '1em 1.5em', background: 'rgb(220, 53, 69)', color: '#fff' }}>
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
