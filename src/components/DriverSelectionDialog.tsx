import type { Schema } from '../../amplify/data/resource';
import './DriverSelectionDialog.css';

interface DriverSelectionDialogProps {
  isOpen: boolean;
  drivers: Array<Schema['Driver']['type']>;
  selectedDriverId: string | null;
  onSelectDriver: (driverId: string | null) => void;
  onConfirm: () => void;
  onCancel: () => void;
  tripCount?: number;
  title?: string;
  confirmText?: string;
  description?: string;
  allowUnassigned?: boolean;
}

function DriverSelectionDialog({
  isOpen,
  drivers,
  selectedDriverId,
  onSelectDriver,
  onConfirm,
  onCancel,
  tripCount,
  title,
  confirmText,
  description,
  allowUnassigned = true,
}: DriverSelectionDialogProps) {
  if (!isOpen) return null;

  const activeDrivers = drivers.filter(d => d.isActive !== false);
  
  const defaultTitle = tripCount !== undefined 
    ? `Assign ${tripCount} Trip${tripCount > 1 ? 's' : ''} to Driver`
    : 'Select Driver';
  
  const defaultDescription = tripCount !== undefined
    ? `Select a driver to assign ${tripCount} selected trip${tripCount > 1 ? 's' : ''} to:`
    : 'Select a driver:';
  
  const defaultConfirmText = 'Assign';

  return (
    <div className="dialog-overlay" onClick={onCancel}>
      <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <h3>{title || defaultTitle}</h3>
          <button className="dialog-close" onClick={onCancel} aria-label="Close">
            ×
          </button>
        </div>
        
        <div className="dialog-body">
          <p className="dialog-description">
            {description || defaultDescription}
          </p>
          
          <div className="driver-selection-list">
            {allowUnassigned && (
              <label className="driver-option">
                <input
                  type="radio"
                  name="driver"
                  value=""
                  checked={selectedDriverId === null}
                  onChange={() => onSelectDriver(null)}
                />
                <span className="driver-option-label">
                  <strong>Unassigned</strong>
                  <span className="driver-option-description">Remove assignment</span>
                </span>
              </label>
            )}
            
            {activeDrivers.length === 0 ? (
              <p className="no-drivers">No active drivers available. Please add drivers first.</p>
            ) : (
              activeDrivers.map((driver) => (
                <label key={driver.id} className="driver-option">
                  <input
                    type="radio"
                    name="driver"
                    value={driver.id}
                    checked={selectedDriverId === driver.id}
                    onChange={() => onSelectDriver(driver.id)}
                  />
                  <span className="driver-option-label">
                    <strong>{driver.name}</strong>
                    <span className="driver-option-description">
                      {driver.email && `📧 ${driver.email}`}
                      {driver.email && driver.phone && ' • '}
                      {driver.phone && `📱 ${driver.phone}`}
                      {!driver.email && !driver.phone && 'No contact info'}
                    </span>
                  </span>
                </label>
              ))
            )}
          </div>
        </div>
        
        <div className="dialog-footer">
          <button className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={onConfirm}
            disabled={selectedDriverId === null && activeDrivers.length > 0}
          >
            {confirmText || defaultConfirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DriverSelectionDialog;
