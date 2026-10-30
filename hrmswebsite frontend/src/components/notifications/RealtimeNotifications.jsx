import { useEffect, useState } from "react";
import { Client } from "@stomp/stompjs";
import {FiBell,FiCheckCircle,FiX,FiMail,FiMessageCircle,FiInfo,FiAlertCircle,} from "react-icons/fi";
import "./RealtimeNotifications.css";
function getSavedToken() {
  return (
    sessionStorage.getItem("hrms-token") ||
    localStorage.getItem("hrms-token") ||
    sessionStorage.getItem("token") ||
    localStorage.getItem("token") ||
    ""
  );
}
function getIcon(type) {
  const value = String(type || "").toLowerCase();
  if (value.includes("mail") || value.includes("email")) {
    return <FiMail />;
  }
  if (value.includes("chat") || value.includes("message")) {
    return <FiMessageCircle />;
  }
  if (value.includes("success") || value.includes("approved")) {
    return <FiCheckCircle />;
  }
  if (
    value.includes("error") ||
    value.includes("failed") ||
    value.includes("rejected")
  ) {
    return <FiAlertCircle />;
  }
  return <FiInfo />;
}
export default function RealtimeNotifications({ onNotification }) {
  const [toasts, setToasts] = useState([]);
  const [connected, setConnected] = useState(false);
  useEffect(() => {
    const token = getSavedToken();
    if (!token) {
      console.warn("HRMS notifications: No login token was found.");
      setConnected(false);
      return undefined;
    }
    let active = true;
    let subscription = null;
    const timeoutIds = new Set();
    const client = new Client({
      brokerURL: "ws://localhost:8080/ws",
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        if (!active) return;
        setConnected(true);
        subscription = client.subscribe(
          "/user/queue/notifications",
          (frame) => {
            if (!active) return;
            try {
              const data = JSON.parse(frame.body);
              const id = `${Date.now()}-${Math.random()
                .toString(36)
                .slice(2)}`;
              const notification = {
                ...data,
                id,
                receivedAt: new Date().toISOString(),
              };
              onNotification?.(notification);
              setToasts((current) =>
                [...current, notification].slice(-5)
              );
              const timeoutId = window.setTimeout(() => {
                timeoutIds.delete(timeoutId);
                setToasts((current) =>
                  current.filter((item) => item.id !== id)
                );
              }, 6000);
              timeoutIds.add(timeoutId);
            } catch (error) {
              console.error(
                "HRMS notifications: Could not parse message.",
                error
              );
            }
          }
        );
      },
      onWebSocketError: (event) => {
        if (!active) return;
        setConnected(false);
        console.error("HRMS notification WebSocket error:", event);
      },
      onWebSocketClose: () => {
        if (!active) return;
        setConnected(false);
      },
      onStompError: (frame) => {
        if (!active) return;
        setConnected(false);
        console.error(
          "HRMS STOMP error:",
          frame.headers?.message || frame.body
        );
      },
      onDisconnect: () => {
        if (active) setConnected(false);
      },
    });
    client.activate();
    return () => {
      active = false;
      if (subscription) {
        subscription.unsubscribe();
      }
      timeoutIds.forEach((timeoutId) => {
        window.clearTimeout(timeoutId);
      });
      timeoutIds.clear();
      client.deactivate();
    };
  }, [onNotification]);
  return (
    <div
      className="hrms-notification-container"
      aria-live="polite"
      aria-relevant="additions"
    >
      <div className="hrms-notification-list">
        {toasts.map((notification) => (
          <article
            className="hrms-notification-toast"
            key={notification.id}
            role="status"
          >
            <div className="hrms-notification-icon">
              {getIcon(notification.type)}
            </div>
            <div className="hrms-notification-content">
              <strong>
                {notification.title || "HRMS Notification"}
              </strong>
              <p>
                {notification.message || "You have a new notification."}
              </p>
              {notification.senderEmail && (
                <small>From: {notification.senderEmail}</small>
              )}
            </div>
            <button
              type="button"
              className="hrms-notification-close"
              aria-label="Dismiss notification"
              onClick={() =>
                setToasts((current) =>
                  current.filter((item) => item.id !== notification.id)
                )
              }
            >
              <FiX />
            </button>
          </article>
        ))}
      </div>
      <span className="hrms-notification-connection">
        <span
          className={
            connected
              ? "hrms-connection-dot connected"
              : "hrms-connection-dot disconnected"
          }
        />
        <FiBell />
        <span>
          {connected
            ? "Notifications connected"
            : "Connecting notifications"}
        </span>
      </span>
    </div>
  );
}
