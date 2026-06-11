import { useState, type FormEvent } from "react";
import { Button, Card, EmptyState, Input, Label, MoneyField, ScreenHero, TextField } from "../../shared/components/ui";
import { useSpaData } from "../../shared/data/SpaDataContext";
import { formatCurrency } from "../../shared/utils/formatCurrency";
import { getServiceMargin } from "../../shared/utils/financials";
import { serviceSchema } from "../../shared/validation/schemas";

export function ServicesPlaceholder() {
  const { services, upsertService, deactivateService } = useSpaData();
  const [editingId, setEditingId] = useState<string | undefined>();
  const [name, setName] = useState("");
  const [defaultPrice, setDefaultPrice] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = serviceSchema.safeParse({ name, defaultPrice, estimatedCost });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Revisa el servicio.");
      return;
    }

    await upsertService({
      id: editingId,
      name: parsed.data.name,
      defaultPrice: parsed.data.defaultPrice,
      estimatedCost: parsed.data.estimatedCost,
    });
    resetForm();
  }

  function editService(serviceId: string) {
    const service = services.find((item) => item.id === serviceId);
    if (!service) {
      return;
    }

    setEditingId(service.id);
    setName(service.name);
    setDefaultPrice(String(service.defaultPrice));
    setEstimatedCost(String(service.estimatedCost));
    setError("");
  }

  function resetForm() {
    setEditingId(undefined);
    setName("");
    setDefaultPrice("");
    setEstimatedCost("");
    setError("");
  }

  return (
    <section className="screen-stack" aria-labelledby="services-title">
      <ScreenHero title="Servicios">Configura nombres, precios y costos aproximados. Las ventas guardan copia histórica.</ScreenHero>

      <Card className="ui-card form-card">
        <Card.Content>
          <form className="form-stack" onSubmit={handleSubmit}>
            <h3>{editingId ? "Editar servicio" : "Agregar servicio"}</h3>
            <TextField
              className="form-control"
              isRequired
              name="service-name"
            >
              <Label>Nombre del servicio</Label>
              <Input
                autoComplete="off"
                value={name}
                variant="secondary"
                onChange={(e) => setName(e.target.value)}
              />
            </TextField>
            <MoneyField isRequired label="Precio" min={1} value={defaultPrice} onValueChange={setDefaultPrice} />
            <MoneyField isRequired label="Costo aproximado" value={estimatedCost} onValueChange={setEstimatedCost} />
            {error ? <p className="error-text">{error}</p> : null}
            <div className="button-row">
              <Button type="submit">
                {editingId ? "Guardar cambios" : "Agregar servicio"}
              </Button>
              {editingId ? (
                <Button variant="ghost" onPress={resetForm}>
                  Cancelar
                </Button>
              ) : null}
            </div>
          </form>
        </Card.Content>
      </Card>

      <div className="list-stack">
        {services.length ? (
          services.map((service) => (
            <Card className={service.isActive ? "ui-card list-row" : "ui-card list-row muted"} key={service.id}>
              <Card.Content>
                <div>
                  <span>{service.isActive ? "Activo" : "Inactivo"}</span>
                  <strong>{service.name}</strong>
                  <p>Lo que te deja el servicio: {Math.round(getServiceMargin(service))}%</p>
                </div>
                <div className="row-actions">
                  <b>{formatCurrency(service.defaultPrice)}</b>
                  <Button size="sm" variant="outline" onPress={() => editService(service.id)}>
                    Editar
                  </Button>
                  {service.isActive ? (
                    <Button variant="danger" size="sm" onPress={() => void deactivateService(service.id)}>
                      Desactivar
                    </Button>
                  ) : null}
                </div>
              </Card.Content>
            </Card>
          ))
        ) : (
          <EmptyState message="Es el primer paso para registrar ventas rápido." title="Aún no has configurado tus servicios." />
        )}
      </div>
    </section>
  );
}
