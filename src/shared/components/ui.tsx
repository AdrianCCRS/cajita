import {
  Button,
  Card,
  Chip,
  Drawer,
  FieldError,
  Input,
  Label,
  Modal,
  ProgressBar,
  Skeleton,
  TextArea,
  TextField,
} from "@heroui/react";
import { AlertTriangle, CheckCircle2, HelpCircle, Info, Plus, X } from "lucide-react";
import { useCallback, useState, type ReactNode } from "react";

type Tone = "neutral" | "income" | "expense" | "business" | "salary" | "profit" | "warning";

type MetricCardProps = {
  title: string;
  value: string;
  description?: string;
  tone?: Tone;
  helpLabel?: string;
  onHelp?: () => void;
};

export function MetricCard({ title, value, description, tone = "neutral", helpLabel, onHelp }: MetricCardProps) {
  return (
    <Card className={`ui-card metric-card metric-card--${tone}`}>
      <Card.Content className="metric-card__body">
        <div className="metric-card__topline">
          <span>{title}</span>
          {onHelp ? (
            <Button isIconOnly aria-label={helpLabel ?? `Explicar ${title}`} className="ghost-icon" size="sm" variant="ghost" onPress={onHelp}>
              <Info aria-hidden="true" size={17} />
            </Button>
          ) : null}
        </div>
        <strong>{value}</strong>
        {description ? <p>{description}</p> : null}
      </Card.Content>
    </Card>
  );
}

type EmptyStateProps = {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ title, message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <Card className="ui-card empty-state">
      <Card.Content>
        <div className="empty-state__icon" aria-hidden="true">
          <HelpCircle size={24} />
        </div>
        <strong>{title}</strong>
        <p>{message}</p>
        {actionLabel && onAction ? (
          <Button onPress={onAction}>
            {actionLabel}
          </Button>
        ) : null}
      </Card.Content>
    </Card>
  );
}

export function SkeletonCard() {
  return (
    <Card className="ui-card skeleton-card">
      <Card.Content>
        <Skeleton className="skeleton-line short" />
        <Skeleton className="skeleton-line tall" />
        <Skeleton className="skeleton-line" />
      </Card.Content>
    </Card>
  );
}

const copFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

type MoneyFieldProps = {
  label: string;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  name?: string;
  minValue?: number;
  placeholder?: string;
  isInvalid?: boolean;
  errorMessage?: string;
  isRequired?: boolean;
};

export function MoneyField({
  label,
  value,
  onChange,
  name,
  minValue = 0,
  placeholder = "Ej. 35000",
  isInvalid,
  errorMessage,
  isRequired,
}: MoneyFieldProps) {
  const [isFocused, setIsFocused] = useState(false);

  const displayValue =
    isFocused
      ? value !== undefined && value !== null ? String(value) : ""
      : value !== undefined && value !== null
        ? copFormatter.format(value)
        : "";

  return (
    <TextField
      className="form-control"
      isInvalid={isInvalid}
      isRequired={isRequired}
      name={name ?? slugName(label)}
    >
      <Label>{label}</Label>
      <Input
        autoComplete="off"
        inputMode="numeric"
        min={minValue}
        placeholder={placeholder}
        type="text"
        value={displayValue}
        variant="secondary"
        onBlur={() => setIsFocused(false)}
        onFocus={() => setIsFocused(true)}
        onChange={(e) => {
          const raw = e.target.value.replace(/[^0-9]/g, "");
          const numeric = raw ? Number(raw) : undefined;
          onChange(numeric);
        }}
      />
      {errorMessage ? <FieldError>{errorMessage}</FieldError> : null}
    </TextField>
  );
}

type BottomSheetProps = {
  isOpen: boolean;
  title: string;
  eyebrow?: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
};

export function BottomSheet({ isOpen, title, eyebrow, children, footer, onClose }: BottomSheetProps) {
  return (
    <Drawer>
      <Drawer.Backdrop
        isOpen={isOpen}
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
      >
        <Drawer.Content placement="bottom">
          <Drawer.Dialog className="bottom-sheet">
            <Drawer.Handle />
            <Drawer.Header className="sheet-title">
              <Drawer.Heading>
                {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
                <h2>{title}</h2>
              </Drawer.Heading>
            </Drawer.Header>
            <Drawer.Body>{children}</Drawer.Body>
            {footer ? <Drawer.Footer>{footer}</Drawer.Footer> : null}
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </Drawer>
  );
}

type ConfirmDialogProps = {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmDialog({ isOpen, title, message, confirmLabel = "Eliminar", onCancel, onConfirm }: ConfirmDialogProps) {
  return (
    <Modal>
      <Modal.Backdrop
        isOpen={isOpen}
        onOpenChange={(open) => {
          if (!open) onCancel();
        }}
      >
        <Modal.Container placement="center">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>{title}</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <p className="dialog-copy">{message}</p>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="ghost" onPress={onCancel}>
                Cancelar
              </Button>
              <Button variant="danger" onPress={onConfirm}>
                {confirmLabel}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

type HelpDrawerProps = {
  isOpen: boolean;
  title: string;
  definition: string;
  example: string;
  decision: string;
  onClose: () => void;
};

export function HelpDrawer({ isOpen, title, definition, example, decision, onClose }: HelpDrawerProps) {
  return (
    <BottomSheet isOpen={isOpen} title={title} eyebrow="Ayuda rápida" onClose={onClose}>
      <div className="help-drawer">
        <p>{definition}</p>
        <Card className="ui-card">
          <Card.Content>
            <span>Ejemplo en tu spa</span>
            <strong>{example}</strong>
          </Card.Content>
        </Card>
        <Card className="ui-card">
          <Card.Content>
            <span>Te ayuda a decidir</span>
            <strong>{decision}</strong>
          </Card.Content>
        </Card>
      </div>
    </BottomSheet>
  );
}

type ToastMessage = {
  kind?: "success" | "warning" | "error";
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function ToastRegion({ toast, onDismiss }: { toast: ToastMessage | null; onDismiss: () => void }) {
  if (!toast) {
    return null;
  }

  const Icon = toast.kind === "warning" || toast.kind === "error" ? AlertTriangle : CheckCircle2;

  return (
    <div aria-live="polite" className={`toast-region toast-region--${toast.kind ?? "success"}`} role="status">
      <Icon aria-hidden="true" size={20} />
      <p>{toast.message}</p>
      {toast.actionLabel && toast.onAction ? (
        <Button size="sm" variant="ghost" onPress={toast.onAction}>
          {toast.actionLabel}
        </Button>
      ) : null}
      <Button isIconOnly aria-label="Cerrar mensaje" className="toast-close" size="sm" variant="ghost" onPress={onDismiss}>
        <X aria-hidden="true" size={16} />
      </Button>
    </div>
  );
}

export function ScreenHero({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="ui-card hero-panel">
      <Card.Header>
        <h2>{title}</h2>
      </Card.Header>
      <Card.Content>
        <p>{children}</p>
      </Card.Content>
    </Card>
  );
}

export function AddButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Button onPress={onPress}>
      <Plus aria-hidden="true" size={18} />
      {label}
    </Button>
  );
}

export { Button, Card, Chip, FieldError, Input, Label, ProgressBar, TextArea, TextField };

function slugName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}
