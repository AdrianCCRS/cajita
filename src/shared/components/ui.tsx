import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Chip,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Progress,
  Skeleton,
  Textarea,
} from "@heroui/react";
import { AlertTriangle, CheckCircle2, HelpCircle, Info, Plus, X } from "lucide-react";
import type { ReactNode } from "react";

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
    <Card className={`ui-card metric-card metric-card--${tone}`} shadow="none">
      <CardBody className="metric-card__body">
        <div className="metric-card__topline">
          <span>{title}</span>
          {onHelp ? (
            <Button isIconOnly aria-label={helpLabel ?? `Explicar ${title}`} className="ghost-icon" size="sm" variant="light" onPress={onHelp}>
              <Info aria-hidden="true" size={17} />
            </Button>
          ) : null}
        </div>
        <strong>{value}</strong>
        {description ? <p>{description}</p> : null}
      </CardBody>
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
    <Card className="ui-card empty-state" shadow="none">
      <CardBody>
        <div className="empty-state__icon" aria-hidden="true">
          <HelpCircle size={24} />
        </div>
        <strong>{title}</strong>
        <p>{message}</p>
        {actionLabel && onAction ? (
          <Button color="primary" radius="sm" onPress={onAction}>
            {actionLabel}
          </Button>
        ) : null}
      </CardBody>
    </Card>
  );
}

export function SkeletonCard() {
  return (
    <Card className="ui-card skeleton-card" shadow="none">
      <CardBody>
        <Skeleton className="skeleton-line short" />
        <Skeleton className="skeleton-line tall" />
        <Skeleton className="skeleton-line" />
      </CardBody>
    </Card>
  );
}

type MoneyFieldProps = {
  label: string;
  value: string | number;
  onValueChange: (value: string) => void;
  name?: string;
  min?: number;
  placeholder?: string;
  isInvalid?: boolean;
  errorMessage?: string;
  isRequired?: boolean;
};

export function MoneyField({
  label,
  value,
  onValueChange,
  name,
  min = 0,
  placeholder = "Ej. 35000",
  isInvalid,
  errorMessage,
  isRequired,
}: MoneyFieldProps) {
  return (
    <Input
      className="form-control"
      errorMessage={errorMessage}
      inputMode="numeric"
      isInvalid={isInvalid}
      isRequired={isRequired}
      label={label}
      min={min}
      name={name ?? slugName(label)}
      placeholder={placeholder}
      radius="sm"
      type="number"
      value={String(value)}
      variant="bordered"
      autoComplete="off"
      onValueChange={onValueChange}
    />
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
    <Drawer className="bottom-sheet" isOpen={isOpen} placement="bottom" size="2xl" onOpenChange={(open) => !open && onClose()}>
      <DrawerContent>
        <DrawerHeader className="sheet-title">
          <div>
            {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
            <h2>{title}</h2>
          </div>
        </DrawerHeader>
        <DrawerBody>{children}</DrawerBody>
        {footer ? <DrawerFooter>{footer}</DrawerFooter> : null}
      </DrawerContent>
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
    <Modal isOpen={isOpen} placement="center" onOpenChange={(open) => !open && onCancel()}>
      <ModalContent>
        <ModalHeader>{title}</ModalHeader>
        <ModalBody>
          <p className="dialog-copy">{message}</p>
        </ModalBody>
        <ModalFooter>
          <Button radius="sm" variant="light" onPress={onCancel}>
            Cancelar
          </Button>
          <Button color="danger" radius="sm" onPress={onConfirm}>
            {confirmLabel}
          </Button>
        </ModalFooter>
      </ModalContent>
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
        <Card className="ui-card" shadow="none">
          <CardBody>
            <span>Ejemplo en tu spa</span>
            <strong>{example}</strong>
          </CardBody>
        </Card>
        <Card className="ui-card" shadow="none">
          <CardBody>
            <span>Te ayuda a decidir</span>
            <strong>{decision}</strong>
          </CardBody>
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
        <Button size="sm" variant="light" onPress={toast.onAction}>
          {toast.actionLabel}
        </Button>
      ) : null}
      <Button isIconOnly aria-label="Cerrar mensaje" className="toast-close" size="sm" variant="light" onPress={onDismiss}>
        <X aria-hidden="true" size={16} />
      </Button>
    </div>
  );
}

export function ScreenHero({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="ui-card hero-panel" shadow="none">
      <CardHeader>
        <h2>{title}</h2>
      </CardHeader>
      <CardBody>
        <p>{children}</p>
      </CardBody>
    </Card>
  );
}

export function AddButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Button color="primary" radius="full" startContent={<Plus aria-hidden="true" size={18} />} onPress={onPress}>
      {label}
    </Button>
  );
}

export { Button, Card, CardBody, CardFooter, CardHeader, Chip, Input, Progress, Textarea };

function slugName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}
