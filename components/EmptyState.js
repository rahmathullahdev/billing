export default function EmptyState({
  icon = 'bi-inbox',
  title = 'Nothing here yet',
  message = '',
  action = null,
  compact = false,
}) {
  return (
    <div className={`empty-state-block ${compact ? 'compact' : ''}`}>
      <i className={`bi ${icon}`} aria-hidden="true"></i>
      <h6>{title}</h6>
      {message ? <p>{message}</p> : null}
      {action ? <div className="empty-state-action">{action}</div> : null}
    </div>
  );
}
