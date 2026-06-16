import { BadgeDollarSign, Calculator, FlaskConical, Package, Pencil, Plus, Power, RotateCcw, Scissors, Trash2 } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import { Table } from "@heroui/react";
import { BottomSheet, Button, Card, EmptyState, Input, Label, MoneyField, ScreenHero, Tabs, TextField } from "../../shared/components/ui";
import { TablePagination } from "../../shared/components/TablePagination";
import { useSpaData } from "../../shared/data/SpaDataContext";
import { useTableSortPagination, type SortConfig } from "../../shared/hooks/useTableSortPagination";
import type { MeasurementType, PurchaseUnit, RawMaterial, Service, ServiceMaterial } from "../../shared/types/domain";
import { formatCurrency } from "../../shared/utils/formatCurrency";
import { getServiceMargin } from "../../shared/utils/financials";
import { getRawMaterialsByCostContribution, getRawMaterialsByServiceCount } from "../../shared/utils/rawMaterialsCharts";
import { buildRawMaterialCalculation, getPurchaseUnits } from "../../shared/utils/rawMaterials";
import { rawMaterialSchema, serviceMaterialSchema, serviceSchema } from "../../shared/validation/schemas";

type ServiceSheetMode = "create" | "edit";
type ServicesTab = "services" | "materials";
type ServiceSortColumn = "name" | "price" | "cost" | "margin" | "status";
type MaterialSortColumn = "name" | "purchase" | "unitCost" | "status";
type MaterialSheetMode = "create" | "edit";
type ServiceMaterialsSheetMode = "list" | "add";
type MaterialStatusFilter = "all" | "active" | "inactive";

const measurementLabels: Record<MeasurementType, string> = {
  volume: "Líquido",
  weight: "Peso",
  unit: "Unidad",
};

const unitLabels: Record<PurchaseUnit, string> = {
  ml: "ml",
  l: "l",
  g: "g",
  kg: "kg",
  unit: "unid.",
};

export function ServicesPlaceholder() {
  const {
    services,
    rawMaterials,
    serviceMaterialsByServiceId,
    upsertService,
    deactivateService,
    upsertRawMaterial,
    deleteRawMaterial,
    upsertServiceMaterial,
    deleteServiceMaterial,
  } = useSpaData();
  const [activeTab, setActiveTab] = useState<ServicesTab>("services");
  const [sheetMode, setSheetMode] = useState<ServiceSheetMode>("create");
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>();
  const [name, setName] = useState("");
  const [defaultPrice, setDefaultPrice] = useState<number | undefined>();
  const [estimatedCost, setEstimatedCost] = useState<number | undefined>();
  const [costCalculationMode, setCostCalculationMode] = useState<Service["costCalculationMode"]>("manual");
  const [error, setError] = useState("");
  const [materialSheetMode, setMaterialSheetMode] = useState<MaterialSheetMode>("create");
  const [isMaterialSheetOpen, setIsMaterialSheetOpen] = useState(false);
  const [editingMaterialId, setEditingMaterialId] = useState<string | undefined>();
  const [rawMaterialName, setRawMaterialName] = useState("");
  const [measurementType, setMeasurementType] = useState<MeasurementType>("volume");
  const [purchaseQuantity, setPurchaseQuantity] = useState<number | undefined>();
  const [purchaseUnit, setPurchaseUnit] = useState<PurchaseUnit>("ml");
  const [purchasePrice, setPurchasePrice] = useState<number | undefined>();
  const [minimumStock, setMinimumStock] = useState<number | undefined>();
  const [materialError, setMaterialError] = useState("");
  const [materialQuery, setMaterialQuery] = useState("");
  const [materialStatusFilter, setMaterialStatusFilter] = useState<MaterialStatusFilter>("all");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [serviceMaterialsSheetMode, setServiceMaterialsSheetMode] = useState<ServiceMaterialsSheetMode>("list");
  const [selectedRawMaterialId, setSelectedRawMaterialId] = useState("");
  const [rawMaterialSearch, setRawMaterialSearch] = useState("");
  const [isMaterialPickerOpen, setIsMaterialPickerOpen] = useState(false);
  const [servicesCovered, setServicesCovered] = useState<number | undefined>();
  const [serviceMaterialError, setServiceMaterialError] = useState("");
  const activeServices = services.filter((service) => service.isActive);
  const activeRawMaterials = rawMaterials.filter((material) => material.isActive);
  const filteredRawMaterials = useMemo(() => {
    const normalizedQuery = materialQuery.trim().toLocaleLowerCase("es-CO");

    return rawMaterials.filter((material) => {
      const matchesQuery = normalizedQuery
        ? material.name.toLocaleLowerCase("es-CO").includes(normalizedQuery)
        : true;
      const matchesStatus = materialStatusFilter === "all"
        ? true
        : materialStatusFilter === "active"
          ? material.isActive
          : !material.isActive;

      return matchesQuery && matchesStatus;
    });
  }, [materialQuery, materialStatusFilter, rawMaterials]);

  const serviceSortFns: Record<ServiceSortColumn, (a: Service, b: Service) => number> = {
    name: (a, b) => a.name.localeCompare(b.name, "es-CO"),
    price: (a, b) => a.defaultPrice - b.defaultPrice,
    cost: (a, b) => a.estimatedCost - b.estimatedCost,
    margin: (a, b) => getServiceMargin(a) - getServiceMargin(b),
    status: (a, b) => Number(a.isActive) - Number(b.isActive),
  };

  const serviceTable = useTableSortPagination({
    data: services,
    defaultSort: { column: "name", direction: "asc" },
    defaultPageSize: 10,
    sortFns: serviceSortFns,
  });

  const materialSortFns: Record<MaterialSortColumn, (a: RawMaterial, b: RawMaterial) => number> = {
    name: (a, b) => a.name.localeCompare(b.name, "es-CO"),
    purchase: (a, b) => a.purchasePrice - b.purchasePrice,
    unitCost: (a, b) => a.unitCost - b.unitCost,
    status: (a, b) => Number(a.isActive) - Number(b.isActive),
  };

  const materialsTable = useTableSortPagination({
    data: filteredRawMaterials,
    defaultSort: { column: "name", direction: "asc" },
    defaultPageSize: 10,
    sortFns: materialSortFns,
  });

  const costContributionData = useMemo(
    () => getRawMaterialsByCostContribution(serviceMaterialsByServiceId, rawMaterials),
    [serviceMaterialsByServiceId, rawMaterials],
  );
  const usageCountData = useMemo(
    () => getRawMaterialsByServiceCount(serviceMaterialsByServiceId, rawMaterials),
    [serviceMaterialsByServiceId, rawMaterials],
  );
  const currentServiceMaterials = selectedService ? serviceMaterialsByServiceId[selectedService.id] ?? [] : [];
  const currentServiceMaterialsTotal = currentServiceMaterials.reduce((total, material) => total + material.totalCost, 0);
  const selectedRawMaterial = activeRawMaterials.find((material) => material.id === selectedRawMaterialId);
  const filteredServiceMaterials = useMemo(() => {
    const normalizedQuery = rawMaterialSearch.trim().toLocaleLowerCase("es-CO");
    const selectedIds = new Set(currentServiceMaterials.map((material) => material.rawMaterialId));

    return activeRawMaterials
      .filter((material) => !selectedIds.has(material.id))
      .filter((material) => normalizedQuery ? material.name.toLocaleLowerCase("es-CO").includes(normalizedQuery) : true)
      .slice(0, 8);
  }, [activeRawMaterials, currentServiceMaterials, rawMaterialSearch]);
  const serviceMaterialPreview = selectedRawMaterial && servicesCovered
    ? {
        quantityUsed: selectedRawMaterial.baseQuantity / servicesCovered,
        totalCost: selectedRawMaterial.purchasePrice / servicesCovered,
      }
    : null;
  const materialPreview = useMemo(() => {
    if (!purchaseQuantity || purchasePrice === undefined) {
      return null;
    }

    try {
      return buildRawMaterialCalculation({
        measurementType,
        purchaseQuantity,
        purchaseUnit,
        purchasePrice,
      });
    } catch {
      return null;
    }
  }, [measurementType, purchasePrice, purchaseQuantity, purchaseUnit]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const currentService = services.find((service) => service.id === editingId);
    const nextEstimatedCost = costCalculationMode === "automatic"
      ? currentService?.estimatedCost ?? 0
      : estimatedCost;
    const parsed = serviceSchema.safeParse({
      name,
      defaultPrice,
      estimatedCost: nextEstimatedCost,
      costCalculationMode,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Revisa el servicio.");
      return;
    }

    await upsertService({
      id: editingId,
      name: parsed.data.name,
      defaultPrice: parsed.data.defaultPrice,
      estimatedCost: parsed.data.estimatedCost,
      costCalculationMode: parsed.data.costCalculationMode,
    });
    resetForm();
  }

  async function handleRawMaterialSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = rawMaterialSchema.safeParse({
      name: rawMaterialName,
      measurementType,
      purchaseQuantity,
      purchaseUnit,
      purchasePrice,
      minimumStock,
    });

    if (!parsed.success) {
      setMaterialError(parsed.error.issues[0]?.message ?? "Revisa el insumo.");
      return;
    }

    await upsertRawMaterial({
      id: editingMaterialId,
      name: parsed.data.name,
      measurementType: parsed.data.measurementType,
      purchaseQuantity: parsed.data.purchaseQuantity,
      purchaseUnit: parsed.data.purchaseUnit,
      purchasePrice: parsed.data.purchasePrice,
      minimumStock: parsed.data.minimumStock,
    });
    resetRawMaterialForm();
  }

  async function reactivateRawMaterial(material: RawMaterial) {
    await upsertRawMaterial({
      id: material.id,
      name: material.name,
      measurementType: material.measurementType,
      purchaseQuantity: material.purchaseQuantity,
      purchaseUnit: material.purchaseUnit,
      purchasePrice: material.purchasePrice,
      stockQuantity: material.stockQuantity,
      minimumStock: material.minimumStock,
    });
  }

  async function handleServiceMaterialSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedService) {
      return;
    }

    const parsed = serviceMaterialSchema.safeParse({
      rawMaterialId: selectedRawMaterialId,
      servicesCovered,
    });

    if (!parsed.success) {
      setServiceMaterialError(parsed.error.issues[0]?.message ?? "Revisa el insumo del servicio.");
      return;
    }

    await upsertServiceMaterial(selectedService.id, parsed.data);
    setSelectedRawMaterialId("");
    setRawMaterialSearch("");
    setIsMaterialPickerOpen(false);
    setServicesCovered(undefined);
    setServiceMaterialError("");
    setServiceMaterialsSheetMode("list");
  }

  function openCreateSheet() {
    setSheetMode("create");
    setEditingId(undefined);
    setName("");
    setDefaultPrice(undefined);
    setEstimatedCost(undefined);
    setCostCalculationMode("manual");
    setError("");
    setIsSheetOpen(true);
  }

  function openEditSheet(service: Service) {
    setSheetMode("edit");
    setEditingId(service.id);
    setName(service.name);
    setDefaultPrice(service.defaultPrice);
    setEstimatedCost(service.estimatedCost);
    setCostCalculationMode(service.costCalculationMode ?? "manual");
    setError("");
    setIsSheetOpen(true);
  }

  function openCreateRawMaterialSheet() {
    setMaterialSheetMode("create");
    setEditingMaterialId(undefined);
    setRawMaterialName("");
    setMeasurementType("volume");
    setPurchaseQuantity(undefined);
    setPurchaseUnit("ml");
    setPurchasePrice(undefined);
    setMinimumStock(undefined);
    setMaterialError("");
    setIsMaterialSheetOpen(true);
  }

  function openEditRawMaterialSheet(material: RawMaterial) {
    setMaterialSheetMode("edit");
    setEditingMaterialId(material.id);
    setRawMaterialName(material.name);
    setMeasurementType(material.measurementType);
    setPurchaseQuantity(material.purchaseQuantity);
    setPurchaseUnit(material.purchaseUnit);
    setPurchasePrice(material.purchasePrice);
    setMinimumStock(material.minimumStock ?? undefined);
    setMaterialError("");
    setIsMaterialSheetOpen(true);
  }

  function openServiceMaterialsSheet(service: Service) {
    setSelectedService(service);
    setServiceMaterialsSheetMode("list");
    setSelectedRawMaterialId("");
    setRawMaterialSearch("");
    setIsMaterialPickerOpen(false);
    setServicesCovered(undefined);
    setServiceMaterialError("");
  }

  function openAddServiceMaterialSheet(service: Service) {
    setSelectedService(service);
    setServiceMaterialsSheetMode("add");
    setSelectedRawMaterialId("");
    setRawMaterialSearch("");
    setIsMaterialPickerOpen(false);
    setServicesCovered(undefined);
    setServiceMaterialError("");
  }

  function changeServiceMaterialSearch(nextValue: string) {
    setRawMaterialSearch(nextValue);
    setIsMaterialPickerOpen(true);
    const matchedMaterial = activeRawMaterials.find((material) => material.name.toLocaleLowerCase("es-CO") === nextValue.trim().toLocaleLowerCase("es-CO"));
    setSelectedRawMaterialId(matchedMaterial?.id ?? "");
  }

  function selectServiceMaterial(material: RawMaterial) {
    setSelectedRawMaterialId(material.id);
    setRawMaterialSearch(material.name);
    setIsMaterialPickerOpen(false);
    setServiceMaterialError("");
  }

  function resetForm() {
    setEditingId(undefined);
    setName("");
    setDefaultPrice(undefined);
    setEstimatedCost(undefined);
    setCostCalculationMode("manual");
    setError("");
    setIsSheetOpen(false);
  }

  function resetRawMaterialForm() {
    setEditingMaterialId(undefined);
    setRawMaterialName("");
    setPurchaseQuantity(undefined);
    setPurchasePrice(undefined);
    setMinimumStock(undefined);
    setMaterialError("");
    setIsMaterialSheetOpen(false);
  }

  function changeMeasurementType(nextType: MeasurementType) {
    setMeasurementType(nextType);
    setPurchaseUnit(getPurchaseUnits(nextType)[0]);
  }

  return (
    <section className="screen-stack" aria-labelledby="services-title">
      <ScreenHero title="Servicios">Configura precios e insumos. El costo puede calcularse con materias primas o dejarse manualmente como respaldo.</ScreenHero>

      <div className="services-tabs-shell">
        <Tabs
          ariaLabel="Organización de servicios"
          items={[
            { id: "services", label: "Servicios", description: `${activeServices.length} activos` },
            { id: "materials", label: "Insumos", description: `${activeRawMaterials.length} activos` },
          ]}
          value={activeTab}
          onChange={setActiveTab}
        />
      </div>

      {activeTab === "services" ? (
        <>
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
                        <th aria-sort={serviceTable.sort.column === "name" ? (serviceTable.sort.direction === "asc" ? "ascending" : "descending") : "none"} scope="col" onClick={() => serviceTable.toggleSort("name")}>
                          Servicio <span className="sort-indicator">{serviceTable.sort.column === "name" ? (serviceTable.sort.direction === "asc" ? "▲" : "▼") : "▸"}</span>
                        </th>
                        <th aria-sort={serviceTable.sort.column === "price" ? (serviceTable.sort.direction === "asc" ? "ascending" : "descending") : "none"} scope="col" onClick={() => serviceTable.toggleSort("price")}>
                          Precio <span className="sort-indicator">{serviceTable.sort.column === "price" ? (serviceTable.sort.direction === "asc" ? "▲" : "▼") : "▸"}</span>
                        </th>
                        <th aria-sort={serviceTable.sort.column === "cost" ? (serviceTable.sort.direction === "asc" ? "ascending" : "descending") : "none"} className="optional-column" scope="col" onClick={() => serviceTable.toggleSort("cost")}>
                          Costo <span className="sort-indicator">{serviceTable.sort.column === "cost" ? (serviceTable.sort.direction === "asc" ? "▲" : "▼") : "▸"}</span>
                        </th>
                        <th aria-sort={serviceTable.sort.column === "margin" ? (serviceTable.sort.direction === "asc" ? "ascending" : "descending") : "none"} className="optional-column" scope="col" onClick={() => serviceTable.toggleSort("margin")}>
                          Deja <span className="sort-indicator">{serviceTable.sort.column === "margin" ? (serviceTable.sort.direction === "asc" ? "▲" : "▼") : "▸"}</span>
                        </th>
                        <th aria-sort={serviceTable.sort.column === "status" ? (serviceTable.sort.direction === "asc" ? "ascending" : "descending") : "none"} scope="col" onClick={() => serviceTable.toggleSort("status")}>
                          Estado <span className="sort-indicator">{serviceTable.sort.column === "status" ? (serviceTable.sort.direction === "asc" ? "▲" : "▼") : "▸"}</span>
                        </th>
                        <th scope="col">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {serviceTable.paginatedData.map((service) => (
                        <tr className={service.isActive ? "" : "muted"} key={service.id}>
                          <th scope="row">
                            <span>{service.name}</span>
                            <small>
                              {service.costCalculationMode === "automatic" ? "Costo por insumos" : "Costo manual"} · Deja {Math.round(getServiceMargin(service))}%
                            </small>
                          </th>
                          <td>
                            <b>{formatCurrency(service.defaultPrice)}</b>
                          </td>
                          <td className="optional-column">{formatCurrency(service.estimatedCost)}</td>
                          <td className="optional-column">
                            <b>{Math.round(getServiceMargin(service))}%</b>
                          </td>
                          <td>
                            <span className={`status-pill ${service.isActive ? "status-pill--active" : "status-pill--inactive"}`}>
                              {service.isActive ? "Activo" : "Inactivo"}
                            </span>
                          </td>
                          <td>
                            <div className="table-actions">
                              <Button isIconOnly aria-label={`Insumos de ${service.name}`} size="sm" variant="outline" onPress={() => openServiceMaterialsSheet(service)}>
                                <Package aria-hidden="true" size={16} />
                              </Button>
                              <Button isIconOnly aria-label={`Agregar insumo a ${service.name}`} size="sm" variant="outline" onPress={() => openAddServiceMaterialSheet(service)}>
                                <Plus aria-hidden="true" size={16} />
                              </Button>
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
                                  costCalculationMode: service.costCalculationMode ?? "manual",
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
                <TablePagination
                  pagination={serviceTable.pagination}
                  onPageChange={serviceTable.setCurrentPage}
                  onPageSizeChange={serviceTable.changePageSize}
                />
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
        </>
      ) : (
        <>
          <Card className="ui-card services-overview">
            <Card.Content>
              <div className="services-overview__copy">
                <FlaskConical aria-hidden="true" size={22} />
                <div>
                  <span>Materias primas</span>
                  <strong>{activeRawMaterials.length} activas de {rawMaterials.length}</strong>
                </div>
              </div>
              <Button onPress={openCreateRawMaterialSheet}>
                <Plus aria-hidden="true" size={18} />
                Nuevo insumo
              </Button>
            </Card.Content>
          </Card>

          <Card className="ui-card list-controls-card">
            <Card.Content>
              <TextField className="form-control" name="material-search">
                <Label>Buscar insumo</Label>
                <Input
                  aria-label="Buscar insumo"
                  autoComplete="off"
                  placeholder="Ej. Removedor"
                  value={materialQuery}
                  variant="secondary"
                  onChange={(event) => setMaterialQuery(event.target.value)}
                />
              </TextField>
              <div className="chip-list" aria-label="Filtrar insumos por estado">
                <Button size="sm" variant={materialStatusFilter === "all" ? "primary" : "tertiary"} onPress={() => setMaterialStatusFilter("all")}>
                  Todos
                </Button>
                <Button size="sm" variant={materialStatusFilter === "active" ? "primary" : "tertiary"} onPress={() => setMaterialStatusFilter("active")}>
                  Activos
                </Button>
                <Button size="sm" variant={materialStatusFilter === "inactive" ? "primary" : "tertiary"} onPress={() => setMaterialStatusFilter("inactive")}>
                  Inactivos
                </Button>
              </div>
            </Card.Content>
          </Card>

          {rawMaterials.length ? (
            <Card className="ui-card service-table-card">
              <Card.Content>
                  {filteredRawMaterials.length ? (
                    <Table className="service-table heroui-data-table" aria-label="Insumos configurados">
                      <Table.ScrollContainer>
                        <Table.Content>
                          <caption>Insumos configurados</caption>
                          <Table.Header>
                            <Table.Column isRowHeader>
                              <span
                                aria-sort={materialsTable.sort.column === "name" ? (materialsTable.sort.direction === "asc" ? "ascending" : "descending") : "none"}
                                className="sortable-col-header"
                                role="button"
                                tabIndex={0}
                                onClick={() => materialsTable.toggleSort("name")}
                                onKeyDown={(e) => { if (e.key === "Enter") materialsTable.toggleSort("name"); }}
                              >
                                Insumo <span className="sort-indicator">{materialsTable.sort.column === "name" ? (materialsTable.sort.direction === "asc" ? "▲" : "▼") : "▸"}</span>
                              </span>
                            </Table.Column>
                            <Table.Column>
                              <span
                                aria-sort={materialsTable.sort.column === "purchase" ? (materialsTable.sort.direction === "asc" ? "ascending" : "descending") : "none"}
                                className="sortable-col-header"
                                role="button"
                                tabIndex={0}
                                onClick={() => materialsTable.toggleSort("purchase")}
                                onKeyDown={(e) => { if (e.key === "Enter") materialsTable.toggleSort("purchase"); }}
                              >
                                Compra <span className="sort-indicator">{materialsTable.sort.column === "purchase" ? (materialsTable.sort.direction === "asc" ? "▲" : "▼") : "▸"}</span>
                              </span>
                            </Table.Column>
                            <Table.Column className="optional-column">
                              <span
                                aria-sort={materialsTable.sort.column === "unitCost" ? (materialsTable.sort.direction === "asc" ? "ascending" : "descending") : "none"}
                                className="sortable-col-header"
                                role="button"
                                tabIndex={0}
                                onClick={() => materialsTable.toggleSort("unitCost")}
                                onKeyDown={(e) => { if (e.key === "Enter") materialsTable.toggleSort("unitCost"); }}
                              >
                                Costo base <span className="sort-indicator">{materialsTable.sort.column === "unitCost" ? (materialsTable.sort.direction === "asc" ? "▲" : "▼") : "▸"}</span>
                              </span>
                            </Table.Column>
                            <Table.Column>
                              <span
                                aria-sort={materialsTable.sort.column === "status" ? (materialsTable.sort.direction === "asc" ? "ascending" : "descending") : "none"}
                                className="sortable-col-header"
                                role="button"
                                tabIndex={0}
                                onClick={() => materialsTable.toggleSort("status")}
                                onKeyDown={(e) => { if (e.key === "Enter") materialsTable.toggleSort("status"); }}
                              >
                                Estado <span className="sort-indicator">{materialsTable.sort.column === "status" ? (materialsTable.sort.direction === "asc" ? "▲" : "▼") : "▸"}</span>
                              </span>
                            </Table.Column>
                            <Table.Column>Acciones</Table.Column>
                          </Table.Header>
                          <Table.Body>
                            {materialsTable.paginatedData.map((material) => (
                            <Table.Row className={material.isActive ? "" : "muted"} key={material.id}>
                              <Table.Cell>
                                <span>{material.name}</span>
                                <small>{measurementLabels[material.measurementType]} · stock {formatQuantity(material.stockQuantity, material.baseUnit)}</small>
                              </Table.Cell>
                              <Table.Cell>
                                <b>{formatQuantity(material.purchaseQuantity, material.purchaseUnit)}</b>
                              </Table.Cell>
                              <Table.Cell className="optional-column">{formatCurrency(material.unitCost)} / {unitLabels[material.baseUnit]}</Table.Cell>
                              <Table.Cell>
                                <span className={`status-pill ${material.isActive ? "status-pill--active" : "status-pill--inactive"}`}>
                                  {material.isActive ? "Activo" : "Inactivo"}
                                </span>
                              </Table.Cell>
                              <Table.Cell>
                                <div className="table-actions">
                                  <Button isIconOnly aria-label={`Editar ${material.name}`} size="sm" variant="outline" onPress={() => openEditRawMaterialSheet(material)}>
                                    <Pencil aria-hidden="true" size={16} />
                                  </Button>
                                  {material.isActive ? (
                                    <Button isIconOnly aria-label={`Desactivar ${material.name}`} size="sm" variant="danger" onPress={() => void deleteRawMaterial(material.id)}>
                                      <Power aria-hidden="true" size={16} />
                                    </Button>
                                  ) : (
                                    <Button isIconOnly aria-label={`Reactivar ${material.name}`} size="sm" variant="outline" onPress={() => void reactivateRawMaterial(material)}>
                                      <RotateCcw aria-hidden="true" size={16} />
                                    </Button>
                                  )}
                                </div>
                              </Table.Cell>
                            </Table.Row>
                          ))}
                        </Table.Body>
                      </Table.Content>
                    </Table.ScrollContainer>
                    </Table>
                  ) : (
                    <div className="inline-empty-state">
                      <strong>No hay insumos con ese filtro.</strong>
                      <p>Prueba con otro nombre o cambia el estado.</p>
                    </div>
                  )}
                  {materialsTable.pagination.totalItems > 0 ? (
                    <TablePagination
                      pagination={materialsTable.pagination}
                      onPageChange={materialsTable.setCurrentPage}
                      onPageSizeChange={materialsTable.changePageSize}
                    />
                  ) : null}
                </Card.Content>
            </Card>
          ) : (
            <EmptyState
              actionLabel="Crear insumo"
              message="Agrega removedor, esmalte, algodón u otros insumos para calcular costos."
              title="Aún no has configurado materias primas."
              onAction={openCreateRawMaterialSheet}
            />
          )}

          {costContributionData.hasData ? (
            <Card className="ui-card wide-card dashboard-chart-card">
              <Card.Content>
                <div className="section-heading">
                  <div className="section-subheading">
                    <span>Costo total por insumo en servicios</span>
                    <strong>Insumos que más aportan al costo</strong>
                  </div>
                </div>
                <div
                  aria-label="Gráfica de insumos que más aportan al costo"
                  className="dashboard-chart"
                  style={{ minHeight: Math.max(costContributionData.labels.length * 44, 200) }}
                >
                  <Chart
                    height="100%"
                    options={materialsBarOptions(costContributionData, true)}
                    series={[{ name: "Costo total", data: costContributionData.series }]}
                    type="bar"
                    width="100%"
                  />
                </div>
              </Card.Content>
            </Card>
          ) : (
            <Card className="ui-card wide-card">
              <Card.Content>
                <div className="chart-empty-state">
                  <p>Asocia insumos a tus servicios para ver cuáles aportan más al costo.</p>
                </div>
              </Card.Content>
            </Card>
          )}

          {usageCountData.hasData ? (
            <Card className="ui-card wide-card dashboard-chart-card">
              <Card.Content>
                <div className="section-heading">
                  <div className="section-subheading">
                    <span>Cantidad de servicios por insumo</span>
                    <strong>Insumos más usados</strong>
                  </div>
                </div>
                <div
                  aria-label="Gráfica de insumos más usados en servicios"
                  className="dashboard-chart"
                  style={{ minHeight: Math.max(usageCountData.labels.length * 44, 200) }}
                >
                  <Chart
                    height="100%"
                    options={materialsBarOptions(usageCountData, false)}
                    series={[{ name: "Servicios", data: usageCountData.series }]}
                    type="bar"
                    width="100%"
                  />
                </div>
              </Card.Content>
            </Card>
          ) : (
            <Card className="ui-card wide-card">
              <Card.Content>
                <div className="chart-empty-state">
                  <p>Asocia insumos a tus servicios para ver cuáles usas con más frecuencia.</p>
                </div>
              </Card.Content>
            </Card>
          )}
        </>
      )}

      {isSheetOpen ? (
        <BottomSheet
          isOpen
          eyebrow="Catálogo de servicios"
          title={sheetMode === "edit" ? "Editar servicio" : "Nuevo servicio"}
          onClose={resetForm}
        >
          <form className="form-stack" onSubmit={handleSubmit}>
            <TextField className="form-control" isRequired name="service-name">
              <Label>Nombre del servicio</Label>
              <Input autoComplete="off" value={name} variant="secondary" onChange={(e) => setName(e.target.value)} />
            </TextField>
            <MoneyField isRequired label="Precio" minValue={1} value={defaultPrice} onChange={setDefaultPrice} />
            <div className="chip-list" aria-label="Modo de cálculo del costo">
              <Button size="sm" variant={costCalculationMode === "automatic" ? "primary" : "tertiary"} onPress={() => setCostCalculationMode("automatic")}>
                Automático
              </Button>
              <Button size="sm" variant={costCalculationMode === "manual" ? "primary" : "tertiary"} onPress={() => setCostCalculationMode("manual")}>
                Manual
              </Button>
            </div>
            {costCalculationMode === "manual" ? (
              <>
                <p className="warning-text">El costo manual es un respaldo. Para mayor precisión, asocia insumos al servicio.</p>
                <MoneyField isRequired label="Costo aproximado" value={estimatedCost} onChange={setEstimatedCost} />
              </>
            ) : (
              <p className="hint-text">El costo se calcula con los insumos asociados al servicio.</p>
            )}
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
                      estimatedCost: costCalculationMode === "manual" ? estimatedCost ?? 0 : services.find((service) => service.id === editingId)?.estimatedCost ?? 0,
                      costCalculationMode,
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

      {isMaterialSheetOpen ? (
        <BottomSheet
          isOpen
          eyebrow="Materias primas"
          title={materialSheetMode === "edit" ? "Editar insumo" : "Nuevo insumo"}
          onClose={resetRawMaterialForm}
        >
          <form className="form-stack" onSubmit={handleRawMaterialSubmit}>
            <TextField className="form-control" isRequired name="raw-material-name">
              <Label>Nombre del insumo</Label>
              <Input autoComplete="off" value={rawMaterialName} variant="secondary" onChange={(e) => setRawMaterialName(e.target.value)} />
            </TextField>
            <div className="chip-list" aria-label="Tipo de medición">
              {(Object.keys(measurementLabels) as MeasurementType[]).map((type) => (
                <Button key={type} size="sm" variant={measurementType === type ? "primary" : "tertiary"} onPress={() => changeMeasurementType(type)}>
                  {measurementLabels[type]}
                </Button>
              ))}
            </div>
            <NumberField label="Cantidad comprada" minValue={1} value={purchaseQuantity} onChange={setPurchaseQuantity} />
            <div className="chip-list" aria-label="Unidad de compra">
              {getPurchaseUnits(measurementType).map((unit) => (
                <Button key={unit} size="sm" variant={purchaseUnit === unit ? "primary" : "tertiary"} onPress={() => setPurchaseUnit(unit)}>
                  {unitLabels[unit]}
                </Button>
              ))}
            </div>
            <MoneyField isRequired label="Precio de compra" value={purchasePrice} onChange={setPurchasePrice} />
            <NumberField label="Mínimo recomendado" value={minimumStock} onChange={setMinimumStock} />
            {materialPreview ? (
              <Card className="ui-card setup-summary service-margin-preview">
                <Card.Content>
                  <FlaskConical aria-hidden="true" size={20} />
                  <div>
                    <span>Base para cálculo</span>
                    <strong>{formatQuantity(materialPreview.baseQuantity, materialPreview.baseUnit)} · {formatCurrency(materialPreview.unitCost)} / {unitLabels[materialPreview.baseUnit]}</strong>
                  </div>
                </Card.Content>
              </Card>
            ) : null}
            {materialError ? <p className="error-text">{materialError}</p> : null}
            <div className="button-row">
              <Button type="submit">
                {materialSheetMode === "edit" ? "Guardar insumo" : "Crear insumo"}
              </Button>
              <Button variant="ghost" onPress={resetRawMaterialForm}>
                Cancelar
              </Button>
            </div>
          </form>
        </BottomSheet>
      ) : null}

      {selectedService ? (
        <BottomSheet
          isOpen
          eyebrow={serviceMaterialsSheetMode === "add" ? "Agregar insumo" : "Costo por insumos"}
          title={selectedService.name}
          onClose={() => setSelectedService(null)}
        >
          <div className="form-stack">
            {serviceMaterialsSheetMode === "list" ? (
              <>
                <div className="service-material-summary">
                  <div>
                    <Package aria-hidden="true" size={20} />
                    <span>Costo total por insumos</span>
                    <strong>{formatCurrency(currentServiceMaterialsTotal)}</strong>
                  </div>
                </div>

                <section className="service-material-section" aria-labelledby="associated-materials-title">
                  <div className="section-heading">
                    <div className="section-subheading">
                      <span>{currentServiceMaterials.length} asociados</span>
                      <strong id="associated-materials-title">Insumos del servicio</strong>
                    </div>
                  </div>
                  {currentServiceMaterials.length ? (
                    <div className="material-list flex flex-col gap-3">
                      {currentServiceMaterials.map((material) => (
                        <MaterialRow
                          key={material.id}
                          material={material}
                          onDelete={() => void deleteServiceMaterial(selectedService.id, material.id)}
                        />
                      ))}
                    </div>
                  ) : null}
                  {!currentServiceMaterials.length ? (
                    <div className="inline-empty-state">
                      <strong>Este servicio todavía no tiene insumos asociados.</strong>
                      <p>Usa el botón + de la tabla para agregar el primer insumo.</p>
                    </div>
                  ) : null}
                </section>
              </>
            ) : null}

            {serviceMaterialsSheetMode === "add" ? (
              <section className="service-material-section service-material-add" aria-labelledby="add-material-title">
                <div className="section-heading">
                  <div className="section-subheading">
                    <span>Nuevo cálculo</span>
                    <strong id="add-material-title">Agregar insumo</strong>
                  </div>
                </div>
                <form className="form-stack" onSubmit={handleServiceMaterialSubmit}>
                  <div className="service-material-picker">
                    <div className="service-material-combobox">
                      <TextField className="form-control" name="service-material-search">
                        <Label>Insumo</Label>
                        <Input
                          aria-autocomplete="list"
                          aria-controls="service-material-results"
                          aria-expanded={isMaterialPickerOpen}
                          aria-label="Buscar insumo para el servicio"
                          autoComplete="off"
                          placeholder="Busca y elige un insumo"
                          role="combobox"
                          value={rawMaterialSearch}
                          variant="secondary"
                          onBlur={() => setIsMaterialPickerOpen(false)}
                          onChange={(event) => changeServiceMaterialSearch(event.target.value)}
                          onFocus={() => setIsMaterialPickerOpen(true)}
                        />
                      </TextField>
                      {isMaterialPickerOpen ? (
                        <div className="service-material-results" id="service-material-results" role="listbox">
                          {filteredServiceMaterials.length ? (
                            filteredServiceMaterials.map((material) => (
                              <button
                                aria-selected={selectedRawMaterialId === material.id}
                                className="service-material-option"
                                key={material.id}
                                role="option"
                                type="button"
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={() => selectServiceMaterial(material)}
                              >
                                <span>{material.name}</span>
                                <small>{formatCurrency(material.purchasePrice)} · {formatQuantity(material.baseQuantity, material.baseUnit)}</small>
                              </button>
                            ))
                          ) : (
                            <div className="service-material-option is-empty">No hay insumos con ese nombre.</div>
                          )}
                        </div>
                      ) : null}
                    </div>
                    <Button isIconOnly aria-label="Agregar insumo al servicio" type="submit">
                      <Plus aria-hidden="true" size={18} />
                    </Button>
                  </div>
                  <NumberField label="¿Para cuántos servicios alcanza?" minValue={1} value={servicesCovered} onChange={setServicesCovered} />
                  {serviceMaterialPreview ? (
                    <Card className="ui-card setup-summary service-margin-preview">
                      <Card.Content>
                        <Calculator aria-hidden="true" size={20} />
                        <div>
                          <span>Costo calculado para este servicio</span>
                          <strong>{formatCurrency(serviceMaterialPreview.totalCost)} · usa aprox. {formatQuantity(serviceMaterialPreview.quantityUsed, selectedRawMaterial?.baseUnit ?? "unit")}</strong>
                        </div>
                      </Card.Content>
                    </Card>
                  ) : null}
                  {serviceMaterialError ? <p className="error-text">{serviceMaterialError}</p> : null}
                  <div className="button-row">
                    <Button variant="ghost" onPress={() => setSelectedService(null)}>
                      Cerrar
                    </Button>
                  </div>
                </form>
              </section>
            ) : null}
          </div>
        </BottomSheet>
      ) : null}
    </section>
  );
}

function NumberField({
  label,
  value,
  onChange,
  minValue = 0,
}: {
  label: string;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  minValue?: number;
}) {
  return (
    <TextField className="form-control">
      <Label>{label}</Label>
      <Input
        aria-label={label}
        autoComplete="off"
        inputMode="decimal"
        min={minValue}
        type="number"
        value={value ?? ""}
        variant="secondary"
        onKeyDown={(event) => {
          if (["-", "+", "e", "E"].includes(event.key)) {
            event.preventDefault();
          }
        }}
        onChange={(event) => {
          const nextValue = event.target.value;
          if (!nextValue) {
            onChange(undefined);
            return;
          }

          const numericValue = Number(nextValue);
          onChange(Number.isFinite(numericValue) && numericValue >= minValue ? numericValue : undefined);
        }}
      />
    </TextField>
  );
}

function MaterialRow({ material, onDelete }: { material: ServiceMaterial; onDelete: () => void }) {
  return (
    <Card className="ui-card list-row">
      <Card.Content>
        <div>
          <span>Alcanza para {new Intl.NumberFormat("es-CO", { maximumFractionDigits: 1 }).format(material.servicesCovered)} servicios · usa aprox. {formatQuantity(material.quantityUsed, material.unitType)}</span>
          <strong>
            <FlaskConical aria-hidden="true" size={16} />
            {material.rawMaterialName}
          </strong>
        </div>
        <div className="row-actions">
          <b>{formatCurrency(material.totalCost)}</b>
          <Button isIconOnly aria-label={`Quitar ${material.rawMaterialName}`} size="sm" variant="danger" onPress={onDelete}>
            <Trash2 aria-hidden="true" size={16} />
          </Button>
        </div>
      </Card.Content>
    </Card>
  );
}

function formatQuantity(value: number, unit: string) {
  return `${new Intl.NumberFormat("es-CO", { maximumFractionDigits: 2 }).format(value)} ${unitLabels[unit as PurchaseUnit] ?? unit}`;
}

const materialsBarPalette = [
  "oklch(0.72 0.16 78)",
  "oklch(0.62 0.18 45)",
  "oklch(0.52 0.17 25)",
  "oklch(0.55 0.15 325)",
  "oklch(0.53 0.14 285)",
  "oklch(0.52 0.12 205)",
  "oklch(0.57 0.13 158)",
];

function materialsBarOptions(
  data: { labels: string[]; series: number[] },
  isCurrency: boolean,
): ApexOptions {
  return {
    chart: {
      fontFamily: "inherit",
      parentHeightOffset: 0,
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    colors: [
      ({ dataPointIndex }: { dataPointIndex: number }) =>
        materialsBarPalette[dataPointIndex % materialsBarPalette.length] ?? "var(--salary)",
    ],
    dataLabels: { enabled: false },
    grid: {
      borderColor: "var(--line)",
      strokeDashArray: 4,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
    },
    legend: { show: false },
    plotOptions: {
      bar: {
        borderRadius: 5,
        horizontal: true,
        barHeight: "60%",
        distributed: true,
        dataLabels: { position: "top" },
      },
    },
    states: {
      hover: { filter: { type: "lighten" } },
    },
    tooltip: {
      y: {
        formatter: (value) =>
          isCurrency ? formatCurrency(value) : String(Math.round(Number(value))),
      },
    },
    xaxis: {
      categories: data.labels,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        formatter: (value) =>
          isCurrency ? formatShortMaterialsCurrency(Number(value)) : String(Math.round(Number(value))),
        style: {
          colors: "var(--muted)",
          fontSize: "12px",
          fontWeight: 800,
        },
      },
    },
    yaxis: {
      labels: {
        formatter: (value) => String(value),
        style: {
          colors: "var(--foreground)",
          fontSize: "13px",
          fontWeight: 700,
        },
      },
    },
  };
}

function formatShortMaterialsCurrency(value: number) {
  if (Math.abs(value) >= 1000000) return `${Math.round(value / 1000000)}M`;
  if (Math.abs(value) >= 1000) return `${Math.round(value / 1000)}K`;
  return String(Math.round(value));
}
