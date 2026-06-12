import { BadgeDollarSign, Pencil, Plus, Power, RotateCcw, Scissors } from "lucide-react";
import { useState, type FormEvent } from "react";
import { BottomSheet, Button, Card, EmptyState, Input, Label, MoneyField, ScreenHero, TextField } from "../../shared/components/ui";
import { useSpaData } from "../../shared/data/SpaDataContext";
import type { Service } from "../../shared/types/domain";
import { formatCurrency } from "../../shared/utils/formatCurrency";
import { getServiceMargin } from "../../shared/utils/financials";
import { serviceSchema } from "../../shared/validation/schemas";

type ServiceSheetMode = "create" | "edit";

export function ServicesPlaceholder() {
  const { services, upsertService, deactivateService } = useSpaData();
  const [sheetMode, setSheetMode] = useState<ServiceSheetMode>("create");
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>();
  const [name, setName] = useState("");
  const [defaultPrice, setDefaultPrice] = useState<number | undefined>();
  const [estimatedCost, setEstimatedCost] = useState<number | undefined>();
  const [error, setError] = useState("");
  const activeServices = services.filter((service) => service.isActive);

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

  function openCreateSheet() {
    setSheetMode("create");
    setEditingId(undefined);
    setName("");
    setDefaultPrice(undefined);
    setEstimatedCost(undefined);
    setError("");
    setIsSheetOpen(true);
  }

  function openEditSheet(service: Service) {
    setSheetMode("edit");
    setEditingId(service.id);
    setName(service.name);
    setDefaultPrice(service.defaultPrice);
    setEstimatedCost(service.estimatedCost);
    setError("");
    setIsSheetOpen(true);
  }

  function resetForm() {
    setEditingId(undefined);
    setName("");
    setDefaultPrice(undefined);
    setEstimatedCost(undefined);
    setError("");
    setIsSheetOpen(false);
  }

  return (
    <section className="screen-stack" aria-labelledby="services-title">
      <ScreenHero title="Servicios">Configura nombres, precios y costos aproximados. Las ventas guardan copia histórica.</ScreenHero>

      <Card className="ui-card services-overview">
        <Card.Content>
          <div className="services-overview__copy">
            <Scissors aria-hidden="true" size={22} />
            <div>
              <span>Catálogo actual</span>
              <strong>{activeServices.length} activos de {services.length}</strong>
            </div>
          </div>
          <Button onPress={openCreateSheet}>
            <Plus aria-hidden="true" size={18} />
            Nuevo servicio
          </Button>
        </Card.Content>
      </Card>

      {services.length ? (
        <Card className="ui-card service-table-card">
          <Card.Content>
            <div className="service-table-scroll">
              <table className="service-table">
                <caption>Servicios configurados</caption>
                <thead>
                  <tr>
                    <th scope="col">Servicio</th>
                    <th scope="col">Precio</th>
                    <th scope="col" className="optional-column">Costo</th>
                    <th scope="col" className="optional-column">Deja</th>
                    <th scope="col">Estado</th>
                    <th scope="col">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((service) => (
                    <tr className={service.isActive ? "" : "muted"} key={service.id}>
                      <th scope="row">
                        <span>{service.name}</span>
                        <small>Lo que te deja: {Math.round(getServiceMargin(service))}%</small>
                      </th>
                      <td>
                        <b>{formatCurrency(service.defaultPrice)}</b>
                      </td>
                      <td className="optional-column">{formatCurrency(service.estimatedCost)}</td>
                      <td className="optional-column">{Math.round(getServiceMargin(service))}%</td>
                      <td>
                        <span className={`status-pill ${service.isActive ? "status-pill--active" : "status-pill--inactive"}`}>
                          {service.isActive ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions">
                          <Button isIconOnly aria-label={`Editar ${service.name}`} size="sm" variant="outline" onPress={() => openEditSheet(service)}>
                            <Pencil aria-hidden="true" size={16} />
                          </Button>
                          {service.isActive ? (
                            <Button isIconOnly aria-label={`Desactivar ${service.name}`} size="sm" variant="danger" onPress={() => void deactivateService(service.id)}>
                              <Power aria-hidden="true" size={16} />
                            </Button>
                          ) : (
                            <Button isIconOnly aria-label={`Reactivar ${service.name}`} size="sm" variant="outline" onPress={() => void upsertService({
                              id: service.id,
                              name: service.name,
                              defaultPrice: service.defaultPrice,
                              estimatedCost: service.estimatedCost,
                            })}>
                              <RotateCcw aria-hidden="true" size={16} />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card.Content>
        </Card>
      ) : (
        <EmptyState
          actionLabel="Crear servicio"
          message="Es el primer paso para registrar ventas rápido."
          title="Aún no has configurado tus servicios."
          onAction={openCreateSheet}
        />
      )}

      {isSheetOpen ? (
        <BottomSheet
          isOpen
          eyebrow="Catálogo de servicios"
          title={sheetMode === "edit" ? "Editar servicio" : "Nuevo servicio"}
          onClose={resetForm}
        >
          <form className="form-stack" onSubmit={handleSubmit}>
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
            <MoneyField isRequired label="Precio" minValue={1} value={defaultPrice} onChange={setDefaultPrice} />
            <MoneyField isRequired label="Costo aproximado" value={estimatedCost} onChange={setEstimatedCost} />
            {defaultPrice ? (
              <Card className="ui-card setup-summary service-margin-preview">
                <Card.Content>
                  <BadgeDollarSign aria-hidden="true" size={20} />
                  <div>
                    <span>Lo que te deja</span>
                    <strong>{Math.round(getServiceMargin({
                      id: editingId ?? "preview",
                      name: name || "Servicio",
                      defaultPrice,
                      estimatedCost: estimatedCost ?? 0,
                      isActive: true,
                      createdAt: "",
                      updatedAt: "",
                    }))}%</strong>
                  </div>
                </Card.Content>
              </Card>
            ) : null}
            {error ? <p className="error-text">{error}</p> : null}
            <div className="button-row">
              <Button type="submit">
                {sheetMode === "edit" ? "Guardar cambios" : "Crear servicio"}
              </Button>
              <Button variant="ghost" onPress={resetForm}>
                Cancelar
              </Button>
            </div>
          </form>
        </BottomSheet>
      ) : null}
    </section>
  );
}
