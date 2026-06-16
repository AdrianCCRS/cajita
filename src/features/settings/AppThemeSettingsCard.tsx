import { Check, Paintbrush, RotateCcw, Save } from "lucide-react";
import { useEffect, useMemo, useState, type ChangeEvent, type CSSProperties } from "react";
import { ColorField, Input as ColorInput, Label as ColorLabel, parseColor } from "react-aria-components/ColorField";
import { ColorSwatch, ColorSwatchPicker, ColorSwatchPickerItem } from "react-aria-components/ColorSwatchPicker";
import { Button, Card } from "../../shared/components/ui";
import { useSpaData } from "../../shared/data/SpaDataContext";
import {
  applyAppTheme,
  applyThemeFromSettings,
  buildAppThemeTokens,
  defaultAppAccentColor,
  normalizeHexColor,
  safeAppThemePalette,
  validateAppThemeColor,
} from "../../shared/utils/themeColor";

export function AppThemeSettingsCard() {
  const { uiSettings, updateAppAccentColor, resetAppAccentColor } = useSpaData();
  const savedColor = uiSettings.appAccentColor;
  const [draftColor, setDraftColor] = useState(savedColor ?? defaultAppAccentColor);
  const [manualColor, setManualColor] = useState(savedColor ?? defaultAppAccentColor);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const normalizedDraft = normalizeHexColor(draftColor);
  const isDirty = normalizeHexColor(savedColor ?? defaultAppAccentColor) !== normalizedDraft;
  const previewTokens = useMemo(() => buildAppThemeTokens(normalizedDraft), [normalizedDraft]);

  useEffect(() => {
    const nextColor = savedColor ?? defaultAppAccentColor;
    setDraftColor(nextColor);
    setManualColor(nextColor);
    setError("");
  }, [savedColor]);

  useEffect(() => {
    if (!validateAppThemeColor(draftColor)) {
      applyAppTheme(draftColor);
    }
  }, [draftColor]);

  useEffect(() => {
    return () => applyThemeFromSettings(savedColor);
  }, [savedColor]);

  function handleColorChange(color: string) {
    const validationError = validateAppThemeColor(color);
    setManualColor(color);
    setStatus("");

    if (validationError) {
      setError(validationError);
      return;
    }

    const normalized = normalizeHexColor(color);
    setError("");
    setDraftColor(normalized);
    setManualColor(normalized);
  }

  function handleManualColor(event: ChangeEvent<HTMLInputElement>) {
    handleColorChange(event.target.value);
  }

  async function handleSave() {
    const validationError = validateAppThemeColor(manualColor);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSaving(true);
    setError("");
    setStatus("");

    try {
      await updateAppAccentColor(normalizeHexColor(manualColor));
      setStatus("Color actualizado.");
    } catch {
      setError("No pudimos guardar el color. Intenta nuevamente.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleReset() {
    setIsSaving(true);
    setError("");
    setStatus("");

    try {
      await resetAppAccentColor();
      applyThemeFromSettings(null);
      setDraftColor(defaultAppAccentColor);
      setManualColor(defaultAppAccentColor);
      setStatus("Color original restaurado.");
    } catch {
      setError("No pudimos restaurar el color. Intenta nuevamente.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card className="ui-card theme-settings-card">
      <Card.Content>
        <div className="theme-settings-heading">
          <div className="theme-settings-heading__icon">
            <Paintbrush aria-hidden="true" size={20} />
          </div>
          <div>
            <span>Personalización</span>
            <strong>Color de la app</strong>
            <p>Elige un color para personalizar Cajita. Ventas, gastos, pagos y vales no cambian.</p>
          </div>
        </div>

        <div className="theme-controls">
          <div className="theme-control-block">
            <span>Colores seguros</span>
            <ColorSwatchPicker
              aria-label="Colores seguros para la app"
              className="theme-swatch-picker"
              value={parseColor(normalizedDraft)}
              onChange={(color) => {
                if (color) {
                  handleColorChange(color.toString("hex"));
                }
              }}
            >
              {safeAppThemePalette.map((color) => (
                <ColorSwatchPickerItem
                  aria-label={color.name}
                  className="theme-swatch-option"
                  color={color.value}
                  key={color.value}
                  onPress={() => handleColorChange(color.value)}
                >
                  <ColorSwatch className="theme-swatch" />
                  <span>{color.name}</span>
                </ColorSwatchPickerItem>
              ))}
            </ColorSwatchPicker>
          </div>

          <ColorField
            className="theme-color-field"
            isInvalid={Boolean(error)}
            value={parseColor(normalizedDraft)}
            onChange={(color) => {
              if (color) {
                handleColorChange(color.toString("hex"));
              }
            }}
          >
            <ColorLabel>Color personalizado</ColorLabel>
            <ColorInput
              aria-describedby="app-theme-color-help app-theme-color-error"
              inputMode="text"
              value={manualColor}
              onChange={handleManualColor}
            />
          </ColorField>
          <p className="hint-text" id="app-theme-color-help">Usa formato HEX, por ejemplo #2563EB.</p>
          {error ? <p className="error-text" id="app-theme-color-error">{error}</p> : null}
          {status ? <p className="success-text">{status}</p> : null}
        </div>

        <ThemePreview accentColor={normalizedDraft} previewTokens={previewTokens} />

        <div className="button-row">
          <Button isDisabled={Boolean(error) || isSaving || !isDirty} onPress={handleSave}>
            <Save aria-hidden="true" size={17} />
            {isSaving ? "Guardando..." : "Guardar color"}
          </Button>
          <Button isDisabled={isSaving} variant="outline" onPress={handleReset}>
            <RotateCcw aria-hidden="true" size={16} />
            Restaurar color original
          </Button>
        </div>
      </Card.Content>
    </Card>
  );
}

function ThemePreview({ accentColor, previewTokens }: { accentColor: string; previewTokens: ReturnType<typeof buildAppThemeTokens> }) {
  return (
    <div
      className="theme-preview"
      style={{
        "--preview-accent": accentColor,
        "--preview-accent-soft": previewTokens["--app-accent-soft"],
        "--preview-accent-foreground": previewTokens["--app-accent-foreground"],
      } as CSSProperties}
    >
      <div className="section-heading">
        <div>
          <span>Vista previa</span><br></br>
          <strong>Así se verá Cajita</strong>
        </div>
      </div>
      <div className="theme-preview__surface">
        <div>
          <span>Detalle visual</span>
          <strong>Botones y acentos</strong>
        </div>
        <button className="theme-preview__button" type="button">
          <Check aria-hidden="true" size={16} />
          Acción principal
        </button>
      </div>
      <div className="theme-finance-preview" aria-label="Colores financieros fijos">
        <span className="finance-token finance-token--income">Venta</span>
        <span className="finance-token finance-token--expense">Gasto</span>
        <span className="finance-token finance-token--salary">Pago</span>
        <span className="finance-token finance-token--vales">Vale</span>
      </div>
    </div>
  );
}
