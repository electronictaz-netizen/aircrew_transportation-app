import type { Schema } from '../../amplify/data/resource';
import './DriverSelectionDialog.css';

interface DriverSelectionDialogProps {
  isOpen: boolean;
  drivers: Array<Schema['Driver']['type']>;
  selectedDriverId: string | null;
  onSelectDriver: (driverId: string | null) => void;
  onConfirm: () => void;
  onCancel: () => void;
  tripCount: number;
}

function DriverSelectionDialog({
  isOpen,
  drivers,
  selectedDriverId,
  onSelectDriver,
  onConfirm,
  onCancel,
  tripCount,
}: DriverSelectionDialogProps) {
  if (!isOpen) return null;

  const activeDrivers = drivers.filter(d => d.isActive !== false);

  return (
    <div className="dialog-overlay" onClick={onCancel}>
      <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <h3>Assign {tripCount} Trip{tripCount > 1 ? 's' : ''} to Driver</h3>
          <button className="dialog-close" onClick={onCancel} aria-label="Close">
            ×
          </button>
        </div>
        
        <div className="dialog-body">
          <p className="dialog-description">
            Select a driver to assign {tripCount} selected trip{tripCount > 1 ? 's' : ''} to:
          </p>
          
          <div className="driver-selection-list">
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
            Assign
          </button>
        </div>
      </div>
    </div>
  );
}

export default DriverSelectionDialog;
