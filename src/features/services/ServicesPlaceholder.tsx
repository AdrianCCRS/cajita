import { useState, type FormEvent } from "react";
import { useSpaData } from "../../shared/data/SpaDataContext";
import { formatCurrency } from "../../shared/utils/formatCurrency";
import { getServiceMargin } from "../../shared/utils/financials";

export function ServicesPlaceholder() {
  const { services, upsertService, deactivateService } = useSpaData();
  const [name, setName] = useState("");
  const [defaultPrice, setDefaultPrice] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await upsertService({
      name: name.trim(),
      defaultPrice: Number(defaultPrice),
      estimatedCost: Number(estimatedCost),
    });
    setName("");
    setDefaultPrice("");
    setEstimatedCost("");
  }

  return (
    <section className="screen-stack" aria-labelledby="services-title">
      <div className="hero-panel">
        <h2 id="services-title">Servicios</h2>
        <p>Configura nombres, precios y costos aproximados. Las ventas guardan copia histórica.</p>
      </div>

      <form className="form-card" onSubmit={handleSubmit}>
        <label>
          Nombre del servicio
          <input value={name} onChange={(event) => setName(event.target.value)} required />
        </label>
        <label>
          Precio
          <input inputMode="numeric" min="1" type="number" value={defaultPrice} onChange={(event) => setDefaultPrice(event.target.value)} required />
        </label>
        <label>
          Costo aproximado
          <input inputMode="numeric" min="0" type="number" value={estimatedCost} onChange={(event) => setEstimatedCost(event.target.value)} required />
        </label>
        <button className="primary-button" type="submit">Agregar servicio</button>
      </form>

      <div className="list-stack">
        {services.length ? (
          services.map((service) => (
            <article className={service.isActive ? "list-row" : "list-row muted"} key={service.id}>
              <div>
                <span>{service.isActive ? "Activo" : "Inactivo"}</span>
                <strong>{service.name}</strong>
                <p>Lo que te deja el servicio: {Math.round(getServiceMargin(service))}%</p>
              </div>
              <div className="row-actions">
                <b>{formatCurrency(service.defaultPrice)}</b>
                {service.isActive ? (
                  <button className="secondary-button" type="button" onClick={() => void deactivateService(service.id)}>
                    Desactivar
                  </button>
                ) : null}
              </div>
            </article>
          ))
        ) : (
          <article className="task-card">
            <span>Sin servicios</span>
            <strong>Aún no has configurado tus servicios.</strong>
            <p>Es el primer paso.</p>
          </article>
        )}
      </div>
    </section>
  );
}
