import { useState, useEffect } from "react";
import { Container, Row, Col, Card, ListGroup, Alert, Badge } from "react-bootstrap";
import { db } from "../firebase";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";

export default function ImpactJournal() {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    if (!user) return;

    const fetchLogs = async () => {
      try {
        const logsRef = collection(db, "users", user.uid, "logs");
        const q = query(logsRef, orderBy("date", "desc"));
        const querySnapshot = await getDocs(q);
        
        const logsData = [];
        querySnapshot.forEach(doc => {
          logsData.push(doc.data());
        });
        
        setLogs(logsData);
        setLoading(false);
      } catch (err) {
        setError("Failed to load journal entries: " + err.message);
        setLoading(false);
      }
    };

    fetchLogs();
  }, [user]);

  if (loading) {
    return (
      <div className="text-center mt-5">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <Container>
      <h2 className="mb-4">Your Impact Journal</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Row>
        <Col md={5}>
          <Card>
            <Card.Header>Your Eco Action History</Card.Header>
            <ListGroup variant="flush" style={{ maxHeight: '600px', overflowY: 'auto' }}>
              {logs.length === 0 ? (
                <ListGroup.Item className="text-center text-muted py-4">
                  No entries yet. Start logging your eco actions!
                </ListGroup.Item>
              ) : (
                logs.map((log, index) => (
                  <ListGroup.Item 
                    key={index}
                    action 
                    active={selectedLog?.date === log.date}
                    onClick={() => setSelectedLog(log)}
                  >
                    <div className="d-flex justify-content-between">
                      <strong>{log.date}</strong>
                      <span className="badge bg-success rounded-pill">
                        {log.points} pts
                      </span>
                    </div>
                    <div className="text-muted small">
                      {log.habits.length} actions
                    </div>
                  </ListGroup.Item>
                ))
              )}
            </ListGroup>
          </Card>
        </Col>
        <Col md={7}>
          {selectedLog ? (
            <Card>
              <Card.Header>
                Eco Actions on {selectedLog.date}
                <Badge bg="success" className="ms-2">
                  {selectedLog.points} points
                </Badge>
              </Card.Header>
              <Card.Body>
                <h5>Actions Taken:</h5>
                <ul>
                  {selectedLog.habits.map((habit, index) => (
                    <li key={index}>
                      {habit.split('_').map(word => 
                        word.charAt(0).toUpperCase() + word.slice(1)
                      ).join(' ')}
                    </li>
                  ))}
                </ul>
                
                <h5 className="mt-4">Carbon Saved:</h5>
                <p>{selectedLog.carbon} kg CO₂</p>
                
                {selectedLog.notes && (
                  <>
                    <h5 className="mt-4">Notes:</h5>
                    <p>{selectedLog.notes}</p>
                  </>
                )}
              </Card.Body>
            </Card>
          ) : (
            <Card>
              <Card.Body className="text-center text-muted py-5">
                {logs.length > 0 
                  ? "Select a date to view details"
                  : "No entries to display"}
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
    </Container>
  );
}