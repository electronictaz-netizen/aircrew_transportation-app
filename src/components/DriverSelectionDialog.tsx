import type { Schema } from '../../amplify/data/resource';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
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
  const activeDrivers = drivers.filter(d => d.isActive !== false);
  
  const defaultTitle = tripCount !== undefined 
    ? `Assign ${tripCount} Trip${tripCount > 1 ? 's' : ''} to Driver`
    : 'Select Driver';
  
  const defaultDescription = tripCount !== undefined
    ? `Select a driver to assign ${tripCount} selected trip${tripCount > 1 ? 's' : ''} to:`
    : 'Select a driver:';
  
  const defaultConfirmText = 'Assign';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title || defaultTitle}</DialogTitle>
          <DialogDescription>
            {description || defaultDescription}
          </DialogDescription>
        </DialogHeader>
        
        <div className="driver-selection-list py-4">
          {allowUnassigned && (
            <label className="driver-option flex items-center space-x-2 p-3 rounded-md border cursor-pointer hover:bg-accent">
              <input
                type="radio"
                name="driver"
                value=""
                checked={selectedDriverId === null}
                onChange={() => onSelectDriver(null)}
                className="cursor-pointer"
              />
              <span className="driver-option-label flex-1">
                <strong className="block">Unassigned</strong>
                <span className="driver-option-description text-sm text-muted-foreground">Remove assignment</span>
              </span>
            </label>
          )}
          
          {activeDrivers.length === 0 ? (
            <p className="no-drivers text-sm text-muted-foreground py-4">No active drivers available. Please add drivers first.</p>
          ) : (
            activeDrivers.map((driver) => (
              <label key={driver.id} className="driver-option flex items-center space-x-2 p-3 rounded-md border cursor-pointer hover:bg-accent">
                <input
                  type="radio"
                  name="driver"
                  value={driver.id}
                  checked={selectedDriverId === driver.id}
                  onChange={() => onSelectDriver(driver.id)}
                  className="cursor-pointer"
                />
                <span className="driver-option-label flex-1">
                  <strong className="block">{driver.name}</strong>
                  <span className="driver-option-description text-sm text-muted-foreground">
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
        
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={selectedDriverId === null && activeDrivers.length > 0}
          >
            {confirmText || defaultConfirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default DriverSelectionDialog;
