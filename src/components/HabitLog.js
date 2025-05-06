import { useState } from "react";
import { Form, Button, ListGroup, FloatingLabel } from "react-bootstrap";

export default function HabitLog({ habitOptions, todayLog, onSubmit }) {
  const [selectedHabits, setSelectedHabits] = useState(todayLog?.habits || []);
  const [notes, setNotes] = useState(todayLog?.notes || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleHabitToggle = (habitId) => {
    setSelectedHabits(prev => 
      prev.includes(habitId) 
        ? prev.filter(id => id !== habitId) 
        : [...prev, habitId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedHabits.length === 0) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(selectedHabits, notes);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      <ListGroup className="mb-3">
        {habitOptions.map(habit => (
          <ListGroup.Item key={habit.id}>
            <Form.Check
              type="checkbox"
              id={`habit-${habit.id}`}
              label={`${habit.name} (${habit.points} pts, saves ${habit.carbon}kg CO₂)`}
              checked={selectedHabits.includes(habit.id)}
              onChange={() => handleHabitToggle(habit.id)}
              disabled={!!todayLog}
            />
          </ListGroup.Item>
        ))}
      </ListGroup>
      
      <FloatingLabel controlId="notes" label="Optional Notes" className="mb-3">
        <Form.Control
          as="textarea"
          placeholder="Add any notes about your eco actions"
          style={{ height: '100px' }}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={!!todayLog}
        />
      </FloatingLabel>
      
      {!todayLog && (
        <Button 
          variant="success" 
          type="submit" 
          disabled={selectedHabits.length === 0 || isSubmitting}
        >
          {isSubmitting ? 'Saving...' : 'Log Today\'s Actions'}
        </Button>
      )}
      
      {todayLog && (
        <div className="alert alert-info">
          You've already logged your eco actions for today. Come back tomorrow!
        </div>
      )}
    </Form>
  );
}