# Brief: proyecto de ejemplo "Edificio Atalaya del Occidente" (Medellín)

Este brief es la base de datos para el ejemplo del Gestor de Proyectos PMBOK. El proyecto es ficticio. Los supuestos se calibraron con norma, mercado y costos de Medellín para 2025 y 2026. La fecha de corte es 2026-09-30 y la investigación se hizo en octubre de 2026. El escenario único, con todas las cifras, está en `brief.json`. Este documento explica las cifras y da los rangos, las fuentes y el nivel de confianza.

Todas las cifras están en pesos colombianos (COP). "M" significa millones de COP.

---

## 1. El escenario en una página

El promotor compra un lote de **50.000 m² en el borde urbano occidental de Medellín por 15.000 M** en abril de 2025, a COP 300.000 por m² bruto. El lote está en suelo de expansión con tratamiento de **Desarrollo (DE)**, dentro de un **plan parcial ya adoptado**, y funciona como una unidad de actuación urbanística. La norma de referencia es el polígono tipo **Z4_DE_1 del Acuerdo 48 de 2014**: 100 viviendas por hectárea y un índice de construcción de 0,6, ambos sobre área bruta, con altura máxima de 8 pisos.

El proyecto es **una sola edificación** con una licencia y un régimen de propiedad horizontal (PH). Una plataforma de parqueaderos soporta **cuatro bloques de 8 pisos** con **416 viviendas** (104 VIS y 312 No VIS) y **24.736 m² vendibles**. Se vende y construye en **dos etapas** de 208 viviendas cada una. Las preventas se manejan con encargo fiduciario y un punto de equilibrio del 75 %.

| # | Cifra clave | Valor elegido | Base o fuente principal |
|---|---|---|---|
| 1 | Lote | 15.000 M (300.000 COP/m² bruto; 384.615/m² neto urbanizable; 555.556/m² útil) | Supuesto del usuario. Camacol Antioquia lo respalda: el suelo "puede costar $300.000" el m² en Medellín (El Colombiano, 2024) |
| 2 | Norma | 100 viv/ha e IC 0,6 sobre área bruta, 8 pisos, IO 45 % del área neta; cesión ≥ 18 % del área bruta | Acuerdo 48 de 2014, arts. 271, 273, 277, 280, 282, 308; capa MapGIS VM_24 |
| 3 | Unidades | 416 (máximo normativo 500 − 78 VIP trasladadas = 422; VIS mínimas 85) | Acuerdo 48, arts. 286, 324-326 |
| 4 | Ventas totales | 162.122 M (6,55 M/m² vendible con parqueaderos; vivienda 6,24 M/m²) | Galería Inmobiliaria, DANE IPVN, listados de Ciencuadras 2026 |
| 5 | Precio VIS | 254 M por unidad de 50 m² (5,08 M/m²; 145,07 SMMLV 2026; tope de 150 SMMLV = 262,6 M) | Decreto 1469 de 2025; Ley 2294 de 2023, art. 293 |
| 6 | Costo directo | 94.510 M = 58,3 % de las ventas; edificación 2,09 M/m² construido; 3,82 M/m² vendible incluido el urbanismo | Construdata 2025 actualizado con el ICOCED de 2026, más la prima de Medellín según Camacol |
| 7 | Incidencia del lote | 9,25 % de las ventas (11,1 % con la compensación VIP); lote / (directos + indirectos) = 12,8 % | H3 Constructora (2025): 3-5 % VIS, 7-8 % estrato 4, hasta 15 % estratos altos |
| 8 | Indirectos | 22.425 M = 13,8 % de las ventas (23,7 % de los directos) | Práctica del sector; tarifas oficiales para licencias, delineación e ICA |
| 9 | Financieros | 7.004 M = 4,3 % de las ventas (crédito de 56.000 M a IBR + 4,5) | BanRep; Portafolio (Constructora Capital, 2025): normal ≈ 3 %, hasta 7-8 % |
| 10 | Utilidad antes de impuestos | 20.183 M = 12,45 % de las ventas en la línea base; pronóstico al corte 16.617 M = 10,1 % | Margen comprimido por el SMMLV de 2026 y el alza de tasas |

---

## 2. Ubicación, tratamiento y norma

### 2.1 Por qué ese lote y ese precio
- Un lote de 5 ha a COP 300.000/m² bruto **no es posible en suelo urbano consolidado** de Medellín. Los lotes de Consolidación y Renovación cuestan millones por m², por ejemplo COP 0,87 a 1,73 M/m² según las zonas geoeconómicas citadas en resoluciones del Distrito de 2025.
- Sí es posible en **suelo de expansión o de Desarrollo en el borde**, que aún debe ceder vías y espacio público, construir redes y estabilizar laderas. La capa oficial de MapGIS lista los polígonos de expansión para el Desarrollo:
  - Altos de Calasanz, Z4_DE_1: 72,9 ha, 100 viv/ha, IC 0,6, 8 pisos.
  - Eduardo Santos, Z4_DE_7: 5,1 ha, 80 viv/ha, IC 0,5, 8 pisos.
  - El Noral, Z6_DE_2: 32,1 ha, 80 viv/ha, IC 0,5, 8 pisos.
  - Las Mercedes, Z6_DE_3: 15,8 ha, 80 viv/ha, IC 0,5, 8 pisos.
  - La Florida, SA_DE_4: 12,0 ha, 100 viv/ha, IC 0,6, 5 pisos.
  - La Florida, SA_DE_5: 26,4 ha, 60 viv/ha, IC 0,4, 5 pisos.
  - Hay además polígonos de Desarrollo en suelo urbano (D) con 30 a 140 viv/ha.
- **Elección: borde occidental (Zona 4), norma tipo Z4_DE_1.** El lote es hipotético y no se ubica en un predio real.
  - El estrato estimado es 3. Se usa para la delineación, los topes de parqueo y el producto.
  - Hay oferta comparable en Robledo, Pajarito y Calasanz: VIS de 48-53 m² y No VIS de 58-72 m².
  - Confianza **media-alta**: los polígonos y la norma son oficiales; la localización exacta es ficticia.
- Eduardo Loaiza, gerente de Camacol Antioquia, dijo en 2024 que en Medellín el suelo "puede costar $300.000" el m², frente a COP 35.000-50.000 en otras plazas (El Colombiano). Ofertas de lotes rurales en Santa Elena (2026) piden entre COP 160.000 y 320.000/m². Confianza **media**.
- **Plan parcial:** es obligatorio en suelo de expansión (Ley 388 de 1997; Acuerdo 48, arts. 277 y 463). Formular y adoptar uno toma de 18 a 36 meses, así que el ejemplo **supone un plan parcial ya adoptado**. Un antecedente real es el plan parcial Altos de Calasanz, adoptado por el Decreto 397 de 2007. En 2025 el promotor solo gestiona la unidad de actuación, el reparto de cargas y la compensación VIP.
- **Revisión del POT:** la revisión de mediano plazo del POT está en curso, con anexos publicados entre julio y septiembre de 2026. Los mapas del Acuerdo 48 siguen vigentes hasta que se adopte. El proyecto licenció en 2025 con el Acuerdo 48, así que la revisión es un riesgo bajo.

### 2.2 Norma aplicable (Acuerdo 48 de 2014)
| Parámetro | Valor | Artículo |
|---|---|---|
| Densidad | 100 viv/ha **sobre área bruta** (franja baja, ≤ 100) | 271.6, 273, 277, 280, 285.3 |
| Índice de construcción (IC) | 0,6 **sobre área bruta** → 30.000 m² | 271.7, 280, 285.3 |
| Qué cuenta en el IC | Áreas privadas, muros y estructura. No cuentan circulaciones, escaleras, porterías, cuartos técnicos ni parqueaderos en sótano o semisótano dentro del tope | 284 |
| Altura | 8 pisos (5 en San Antonio de Prado) | 280 |
| Índice de ocupación | 45 % del área neta (tratamiento de Desarrollo) | 282 |
| Cesión de suelo para espacio público y equipamiento | 5,0 m² por habitante, con mínimo del **18 % del área bruta** en Desarrollo; se toma el mayor | 280, 308 |
| Construcción de equipamiento | 1 m² por vivienda (Zona 4) | 280, 310 |
| Zona verde privada de uso común | ≥ 10 % del área neta del lote | 321 |
| Obligación VIP y VIS (Macroproyecto de Borde, Desarrollo) | 20 % del suelo neto urbanizable para VIP, más 20 % VIS de las viviendas restantes. El 50 % de la VIP se puede trasladar comprando derechos fiduciarios al ISVIMED. La VIS no se traslada | 324, 325, 326 |
| Parqueaderos, estrato 3 (son **máximos**) | Privados 1/1; visitantes 1/4; motos 1/1 y 1/4; bicicletas 1 por cada 10 privados; personas con movilidad reducida (PMR) 1 por cada 30. Con 150 celdas o más se exige estudio de movilidad | 364, 367, 368 |
| Área mínima de vivienda | 1 alcoba 30 m²; 2 alcobas 45 m²; 3 alcobas 60 m² (54 m² en VIP) | 370 |
| Retiro a quebradas en suelo urbano | ≥ 15 m desde la cota máxima de inundación (10 m a estructuras hidráulicas) | Componente general, sistema hidrográfico |
| Suelos que no cuentan como cesión | Áreas dentro de la mancha de inundación de 100 años, retiros, pendientes > 25 %, zonas de alto riesgo | 313 |
| Pago de cesiones en dinero | Se incrementa 15 %. En planes parciales de Desarrollo se cede todo dentro del polígono | 306, 307 |

### 2.3 Presupuesto de suelo (valores elegidos)
| Concepto | m² | % del bruto |
|---|---|---|
| Área bruta | 50.000 | 100 % |
| − Suelo de protección: retiro de quebrada secundaria de 15 m a cada lado y franja con pendiente > 45 % | 7.000 | 14 % |
| − Afectación vial: vía colectora del plan parcial, sección pública de 16 m | 4.000 | 8 % |
| **= Área neta urbanizable** | **39.000** | 78 % |
| − Cesión para espacio público y equipamiento. Rige el 18 % del bruto (9.000 m²); el cálculo por habitantes da 5 × 2,9 × 416 = 6.032 m² | 9.000 | 18 % |
| − Vías locales públicas y andenes | 3.000 | 6 % |
| **= Área útil (lote del edificio)** | **27.000** | 54 % |

**Aprovechamientos resultantes**
- Viviendas: 100 × 5 ha = **500 como máximo**.
- Obligación VIP: 20 % × 39.000 = 7.800 m², que equivalen a **78 VIP** (7.800 m² × 100 viv/ha). Se cumple por **traslado al ISVIMED** con un valor de 7.800 × 384.615 = **3.000 M**.
- Viviendas no VIP: 422. VIS mínimas: 20 % → 85.
- **Proyecto: 416 viviendas**, de las cuales 104 son VIS (más que las 85 exigidas).
- IC usado: 24.736 × 1,08 + 700 m² de comunes = **27.415 m²**, o sea **0,548**, por debajo del máximo de 0,6.
- Huella: 7.600 m², IO de **28,1 %** frente a 45 % permitido.
- Zona verde privada: 3.400 m² frente a 2.700 m² exigidos.
- Equipamiento público: 416 m² construidos.

**Habitantes por vivienda:** el indicador oficial lo fija cada año una circular del DAP con base en la Encuesta de Calidad de Vida. La muestra de la ECV 2025 da cerca de 2,9; se usa **2,9**. Confianza **media**, pero no cambia el resultado porque rige el mínimo del 18 %.

---

## 3. La edificación
- **Una edificación**, una licencia de urbanización y construcción y una PH (Ley 675 de 2001):
  - Una plataforma de parqueaderos en semisótano y sótano parcial de **8.600 m²**.
  - **Cuatro bloques de 8 pisos (A a D)** con 13 apartamentos por piso, unidos por circulaciones y zonas comunes de 1.100 m² (portería, salón social, gimnasio, cuartos técnicos).
  - 8 ascensores, dos por bloque.
- **Áreas construidas:**
  - Bloque A: 6.240 m² (VIS).
  - Bloques B, C y D: 7.815 m² cada uno.
  - Total de torres: 29.685 m².
  - **Total de la edificación: 39.385 m².**
  - El factor entre área construida de torre y área privada es 1,20.
- **Sistema estructural:** muros de concreto vaciados con formaleta industrializada y cimentación en pilas pre-excavadas y zapatas. Es el sistema habitual para VIS y No VIS media de 8 a 20 pisos.
  - NSR-10: Medellín está en **zona de amenaza sísmica intermedia, con Aa = 0,15 y Av = 0,20**. Confianza alta; confirmar en la tabla A.2.3-2 de la NSR-10 y en la microzonificación.
- **Parqueaderos:**
  - 203 privados No VIS (0,65 por vivienda), vendidos aparte a 38 M cada uno.
  - 26 VIS, comunes de uso asignado y no vendidos.
  - 52 de visitantes (1 por cada 8 viviendas), incluidas 10 celdas PMR.
  - 104 de motos y 60 de bicicletas.
  - **Total: 281 celdas de carro**, por lo que se exige estudio de movilidad.
  - Todos están por debajo de los topes del estrato 3. Camacol Antioquia ha señalado que exigir parqueaderos sube el precio de la vivienda entre 15 % y 20 %; por eso la dotación es inferior al tope.
- **Etapas:**
  - E1: bloques A y B, el 50 % de la plataforma y el urbanismo y las cargas de la fase 1 (60 %). Son 208 viviendas y **47.024 M de directos**.
  - E2: bloques C y D, el 50 % de la plataforma y el urbanismo de la fase 2. Son 208 viviendas y **47.486 M**.

---

## 4. Mercado, producto y ventas

### 4.1 Contexto de mercado (2025-2026)
- **Precio de vivienda nueva:** el IPVN de Medellín AM subió 9,14 % anual en el II trimestre de 2026. En el municipio de Medellín subió 5,58 %: estratos bajos −1,92 %, estrato 4 +7,43 % y estratos altos +6,18 % (DANE).
- **Precio promedio:** Galería Inmobiliaria, citada en 2026, da para Medellín unos 9,7 M/m² en No VIS (promedio de ciudad, sesgado por El Poblado) y unos 5,19 M/m² en VIS. Confianza media, porque es una cita de segunda mano.
- **Referentes de 2026 (Ciencuadras):**
  - Luna del Cerro, Robledo-Pajarito: VIS de 48,22 m² desde 206,5 M, unos 4,28 M/m², con lista desactualizada.
  - Ciudadela del Parque, Itagüí: No VIS de 59,7 a 71,5 m² a 6,6-7,2 M/m².
  - Colonia, Belén: 7,5-7,6 M/m².
  - En Calasanz se ofrecen cesiones de derechos de unos 5,8 M/m².
- **Ventas:**
  - Galería: en el I semestre de 2026 Medellín vendió 8.596 unidades, 15 % menos que las 10.054 del I semestre de 2025. En el país, VIS −2,1 % y No VIS −16,1 %.
  - Camacol Antioquia: en el I semestre de 2025 el municipio de Medellín vendió 2.208 unidades y el departamento 10.978 (+30,1 %).
- **Subsidios:** Mi Casa Ya no tuvo nuevas asignaciones en 2026 por falta de presupuesto. El nuevo gobierno, posesionado el 7 de agosto de 2026, anunció "Casa Milagro", aún sin reglas. Siguen activos Comfama, VIVA Antioquia (convocatoria cerrada en febrero de 2026) e ISVIMED (hasta 15 M).

### 4.2 Topes y precios elegidos
- **SMMLV:** 2025 = 1.423.500. **2026 = 1.750.905** (Decreto 1469 de 2025, +23,7 %). El Consejo de Estado lo suspendió y luego revocó la suspensión el 17 de julio de 2026.
- **Topes VIS y VIP:** VIS 150 SMMLV para Medellín (Ley 2294 de 2023, art. 293) = **262.635.750 en 2026**; VIP 90 SMMLV = 157.581.450.
  - Hay un borrador de decreto de MinVivienda (enero y febrero de 2026) que fija el precio en pesos y un tope único de 135 SMMLV. No encontré confirmación de que se haya expedido; se trata como riesgo.
- **Mezcla de producto (área privada):**

| Tipo | Descripción | m² | Unidades | Precio promedio realizado | Precio/m² | Ventas (M) |
|---|---|---|---|---|---|---|
| A (VIS) | 2 alcobas + estudio, 2 baños, balcón; bloque A | 50 | 104 | 254,0 M (pactado en pesos; 145,07 SMMLV 2026) | 5,08 M | 26.416 |
| B (No VIS) | 2 alcobas + estudio, 2 baños, balcón; 56 por bloque B, C y D | 58 | 168 | 383,0 M | 6,60 M | 64.344 |
| C (No VIS) | 3 alcobas, 2 baños, balcón; 48 por bloque B, C y D | 68 | 144 | 442,0 M | 6,50 M | 63.648 |
| Parqueaderos No VIS | — | — | 203 | 38,0 M | — | 7.714 |
| **Total** | | **24.736** | **416** | | **6,24 M (solo vivienda)** | **162.122** |

- **Precios de lanzamiento No VIS:**
  - E1 (julio de 2025): B 6,30 M/m² y C 6,20 M/m².
  - E2 (marzo de 2026): B 6,75 M/m² y C 6,65 M/m².
  - La lista sube 0,6 % al mes (unos 7,4 % al año, en línea con el IPVN). El promedio realizado de la línea base es B 6,60 y C 6,50.
- **Condiciones de venta:**
  - Separación: 1 M en VIS y 5 M en No VIS.
  - Cuota inicial: **20 % en VIS y 30 % en No VIS**, en cuotas mensuales hasta dos meses antes de la entrega (18 a 24 meses).
  - Saldo: **crédito hipotecario o leasing habitacional** (80 % en VIS y 70 % en No VIS) a la escrituración. Las VIS pueden usar subsidios de caja de compensación.
  - Desistimientos supuestos: 5 %.
- **Punto de equilibrio (PE): 75 % de las unidades de cada etapa (156 de 208).** Además exige:
  - licencia ejecutoriada;
  - lote en el patrimonio autónomo libre de gravámenes;
  - crédito constructor aprobado;
  - presupuesto y flujo validados por la fiduciaria.
  - Rango observado: históricamente entre 60 % y 70 %. Camacol (Portafolio) reportó que subió a 85 %, y a 90 % en VIS.
- **Velocidad de ventas en la línea base: 18 unidades al mes.** Es alrededor del 5 % de las ventas del municipio. En la realidad del ejemplo, la E1 vendió unas 20 al mes y la E2 vende unas 11 al mes.

---

## 5. Costos directos (presupuesto de línea base, pesos corrientes)

| Componente | Cantidad | Costo unitario | Valor (M) |
|---|---|---|---|
| Torres residenciales | 29.685 m² | 2,20 M/m² | 65.307 |
| Plataforma de parqueaderos | 8.600 m² | 1,65 M/m² | 14.190 |
| Zonas comunes | 1.100 m² | 2,40 M/m² | 2.640 |
| Vías públicas (colectora y local) | 7.000 m² | 0,78 M/m² | 5.460 |
| Adecuación del parque de cesión | 9.000 m² | 0,19 M/m² | 1.710 |
| Redes externas EPM | global | — | 2.350 |
| Equipamiento público | 416 m² | 3,30 M/m² | 1.373 |
| Urbanismo interno y paisajismo | global | — | 1.250 |
| Restauración del retiro de quebrada | global | — | 230 |
| **Total de directos** | | | **94.510 (58,3 % de las ventas)** |

**De dónde salen los costos unitarios**
- Construdata 213 (febrero de 2025) da para multifamiliar VIS de estrato 3 entre 1,73 y 2,18 M/m² construido (columnas de directo y total; texto parcial).
- Se actualiza con el ICOCED: +6,59 % anual a junio de 2026, con la mano de obra en +14,06 %.
- Se aplica la prima del Valle de Aburrá: Camacol Antioquia dice que los costos pueden ser hasta 20 % mayores que en otras ciudades.
- Resultado: **2,0 a 2,4 M/m² construido** para torre industrializada de 8 pisos, con acabados VIS y No VIS medios. Se elige 2,20 M/m².
- Confianza **media**. No pude leer la tabla de Construdata 217 ni la 218, que son de pago. Las referencias de blogs para 2026 difieren mucho entre sí.

**Capítulos.** Los porcentajes están calibrados con el presupuesto real de un proyecto VIS industrializado de 9 pisos (Universidad Distrital, 2024): estructura 26,9 %, cimentación 9,8 %, movimiento de tierras 4,2 %, eléctricas 9,2 %, hidrosanitarias 6,6 %, mampostería 6,6 %, administración y gastos generales 7,5 %, obras exteriores 5,5 %. Se ajustan por la ladera, la plataforma y las cargas del plan parcial.

| Capítulo | M | % de directos |
|---|---|---|
| Preliminares y obras provisionales | 1.701 | 1,80 |
| Movimiento de tierras, contención y estabilización de taludes | 5.199 | 5,50 |
| Cimentación (pilas y zapatas, vigas de amarre) | 7.562 | 8,00 |
| Estructura en concreto (muros vaciados, losas, plataforma) | 23.157 | 24,50 |
| Mampostería y muros divisorios | 3.686 | 3,90 |
| Instalaciones hidrosanitarias, red contra incendio y gas | 6.144 | 6,50 |
| Instalaciones eléctricas, iluminación y telecomunicaciones (RETIE, RETILAP, RITEL) | 6.427 | 6,80 |
| Equipos especiales (ascensores, bombeo, planta eléctrica, detección) | 3.308 | 3,50 |
| Cubiertas e impermeabilizaciones | 1.701 | 1,80 |
| Pañetes, estucos y pintura | 3.214 | 3,40 |
| Pisos y enchapes | 4.348 | 4,60 |
| Carpintería metálica, ventanería y barandas | 3.403 | 3,60 |
| Carpintería de madera (puertas, clósets, muebles de cocina) | 2.268 | 2,40 |
| Aparatos sanitarios, griferías y equipos de cocina | 2.079 | 2,20 |
| Fachada y obras exteriores del edificio | 1.323 | 1,40 |
| Administración de obra y gastos generales (personal, campamento, SST, equipos) | 6.144 | 6,50 |
| Aseo general, pruebas y entrega | 473 | 0,50 |
| Urbanismo, vías, redes externas EPM, equipamiento y cesiones (cargas) | 11.123 | 11,77 |
| Paisajismo, zonas verdes privadas y dotación de zonas comunes | 1.250 | 1,32 |
| **Total** | **94.510** | **100** |

La mano de obra pesa entre 20 % y 25 % de los directos, y la mano de obra y los materiales juntos cerca del 70 % del directo de una VIS (Camacol).

---

## 6. Costos indirectos (línea base)
| Concepto | Base | M | % de ventas |
|---|---|---|---|
| Estructuración: estudio de mercado, factibilidad técnica, legal y financiera, títulos, avalúo | global | 420 | 0,26 |
| Estudios y diseños: arquitectura, geotecnia, estructural NSR-10 con revisión independiente, técnicos, bioclimático, movilidad | 2,4 % de directos | 2.268 | 1,40 |
| Licencias y trámites: expensas de curaduría, delineación (0,3 % en estrato 3), nomenclatura, EPM, movilidad, permisos ambientales | global | 480 | 0,30 |
| Supervisión técnica independiente (Ley 1796) | 0,6 % de directos | 567 | 0,35 |
| Interventoría técnica, administrativa y financiera (banco y fiducia) | 0,5 % de directos | 473 | 0,29 |
| Gerencia del proyecto (promotor) | 3,0 % de ventas | 4.864 | 3,00 |
| Comisiones de ventas | 1,5 % de ventas | 2.432 | 1,50 |
| Publicidad y mercadeo | 0,9 % de ventas | 1.459 | 0,90 |
| Sala de ventas y apartamento modelo | global | 680 | 0,42 |
| Fiducia (encargo de preventas y patrimonio autónomo) | 0,35 % de ventas | 567 | 0,35 |
| Pólizas: TRC, RCE, cumplimiento y amparo patrimonial de la Ley 1796 | 0,6 % de directos | 567 | 0,35 |
| Notariado, registro y escrituración a cargo del promotor | 0,35 % de ventas | 567 | 0,35 |
| Impuesto predial del lote (2025-2029) | global | 380 | 0,23 |
| ICA (5 por mil) y avisos y tableros (15 % del ICA) | 0,575 % de ventas | 932 | 0,57 |
| GMF (4 por mil) | global | 560 | 0,35 |
| Servicios provisionales de obra y conexiones definitivas EPM | global | 1.150 | 0,71 |
| Legal, contable, revisoría fiscal, SAGRILAFT/SARLAFT y sistemas | 0,45 % de ventas | 730 | 0,45 |
| Administración provisional de la PH | global | 210 | 0,13 |
| Posventas y garantías (Ley 1480) | 0,8 % de directos | 756 | 0,47 |
| **Imprevistos (reserva de contingencia)** | 2,5 % de directos | **2.363** | 1,46 |
| **Total de indirectos** | | **22.425** | **13,83** (23,7 % de directos) |

**Además: reserva de gestión de 1.400 M**, por fuera de la línea base y aprobada por la junta.

**Datos oficiales que respaldan las tarifas**
- **Expensas de curaduría** (Decreto 1077 de 2015, art. 2.2.6.6.8.3, modificado por el Decreto 1890 de 2021):
  - Fórmula: E = Cf × i × m + Cv × i × j × m.
  - Cargo fijo Cf = 10,01 UVT y cargo variable Cv = 20,02 UVT.
  - Para más de 11.000 m²: j = 2,2 / (0,018 + 800/Q). Para urbanismo: j = 4 / (0,025 + 2000/Q).
  - Factor i = 1,0 en estrato 3. La VIS paga el 50 % (Ley 810 de 2003).
  - Con UVT 2026 = 52.374 y m ≈ 1: unos 66 M por la construcción y 64 M por el urbanismo.
- **Delineación urbana en Medellín:** 0,3 % para estrato 3, sobre m² × costo directo catastral (Acuerdo 066 de 2017, art. 121; hoy Acuerdo 093 de 2023).
- **ICA, actividad CIIU 4111 (construcción de edificios residenciales):** 5 por mil (Acuerdo 066 de 2017, tabla de servicios). Confirmar la tarifa en el Acuerdo 093 de 2023.
- **Derechos notariales:** 3 por mil, y la mitad en VIS. La resolución de la SNR de 2026 rige desde el 1 de febrero de 2026.
- No encontré tarifas publicadas para fiducia, supervisión técnica ni interventoría. Los porcentajes de esos rubros son práctica del sector, con confianza **media**.

---

## 7. Costos financieros
- **Crédito constructor:**
  - E1: 30.000 M, aprobado el 2026-02-13. E2: 26.000 M, pronosticado para el 2027-04-16.
  - Los 56.000 M equivalen al **59 % de los directos**. Bancolombia financia "hasta el 80 % de los costos", según su ficha de producto.
  - Cada etapa desembolsa por avance durante 14 meses y se amortiza en 5 meses con las subrogaciones a la escrituración.
- **Tasa:** **IBR 3M + 4,5 puntos.**
  - Línea base de 2025: IBR de unos 9,1 % → **13,6 % N.T.V.** Camacol estimó a comienzos de 2026 una tasa promedio de 13,47 % en pesos para proyectos habitacionales.
  - Corte de septiembre de 2026: IBR de unos 12,0 % → **16,5 % N.T.V.**
- **Tasa de política del Banco de la República:**
  - 9,50 % en enero de 2025 y 9,25 % desde abril de 2025.
  - En 2026: **10,25 %** (30 de enero), **11,25 %** (31 de marzo), **12,0 %** (30 de junio) y **12,25 %** (30 de septiembre, vigente desde el 1 de octubre).
  - Inflación de agosto de 2026: 6,24 %.
  - Swap IBR 3M: 11,75 % el 27 de julio de 2026.
  - La DTF deja de publicarse el 1 de enero de 2027.
- **Intereses:**
  - Línea base: E1 3.570 M y E2 3.094 M, más comisiones de 340 M (0,5 % del cupo + 60 M). **Total 7.004 M, 4,3 % de las ventas.**
  - Pronóstico: E1 4.331 M y E2 3.987 M (16,0 %, con un mes de espera), más 340 M. **Total 8.658 M, 5,3 % de las ventas.**
  - Referencia: Constructora Capital (Portafolio, diciembre de 2025) dice que los financieros pasaron del 3 % de las ventas al 7-8 % en algunos proyectos.
- **Aporte de capital del promotor: 24.000 M**: lote, compensación VIP y gastos preoperativos.

---

## 8. Estado de resultados de la línea base (factibilidad aprobada el 2025-04-22, ajustada con los diseños de julio de 2025)
| Concepto | M | % de ventas | COP por m² vendible |
|---|---|---|---|
| **Ventas totales** | **162.122** | 100,00 | 6.554.091 |
| Lote (compra) | 15.000 | 9,25 | 606.404 |
| Compensación de la obligación VIP (ISVIMED) | 3.000 | 1,85 | — |
| Costos directos | 94.510 | 58,30 | 3.820.747 |
| Costos indirectos | 22.425 | 13,83 | 906.573 |
| Costos financieros | 7.004 | 4,32 | 283.150 |
| **Costo total** | **141.939** | **87,55** | |
| **Utilidad antes de impuestos** | **20.183** | **12,45** | 815.936 |
| Impuesto de renta (35 %) | 7.064 | 4,36 | |
| Utilidad neta | 13.119 | 8,09 | |

**Relaciones entre cifras**
- Ventas / costo total = 1,142. La utilidad es 14,2 % sobre los costos.
- Lote / (directos + indirectos) = **12,8 %**. Lote / ventas = **9,25 %**, dentro del 8-15 % típico. El rango es de 3-5 % en VIS y 7-8 % en estrato 4, según H3 (2025). La mezcla es 75 % No VIS, de ahí el 9 %.
- Directos sobre ventas: 58,3 %.
- Rentabilidad antes de impuestos sobre el aporte de capital: 84 % en unos 4,5 años.
- **Margen objetivo del sector: 12 a 15 % en No VIS y 8 a 10 % en VIS.**
  - Constructora Capital (Portafolio, 2025) perdió "por lo menos 8 puntos" de margen por la inflación y las tasas, y "muchos proyectos llegaron a tener utilidad cero".
  - Confianza **media** para la banda de margen, que es práctica del sector y no una estadística oficial.

**Pronóstico al corte (2026-09-30)**
| Concepto | M |
|---|---|
| Ventas | 164.682 (+3 % de precio en la E2 = +2.560) |
| Directos | 98.890 (+4,0 % por mano de obra, más 600 M de contención tomados de la contingencia) |
| Indirectos | 22.517 |
| Financieros | 8.658 |
| **Costo total** | **148.065** |
| **Utilidad** | **16.617 = 10,1 % de las ventas** |

---

## 9. Cronograma (línea base y pronóstico)

`brief.json → cronograma` tiene las 65 actividades e hitos con fechas de línea base, fechas pronosticadas y avance al corte. Todas las fechas caen en días hábiles. Los hitos principales son:

| Hito | Línea base | Real o pronóstico |
|---|---|---|
| Acta de constitución | 2025-01-13 | 2025-01-13 |
| Promesa del lote (20 % = 3.000 M) | 2025-02-28 | 2025-02-28 |
| Decisión de inversión (junta) | 2025-04-22 | 2025-04-22 |
| Escritura del lote (80 % = 12.000 M) y aporte al patrimonio autónomo | 2025-04-30 | 2025-04-30 |
| Encargo fiduciario de preventas | 2025-06-13 | 2025-06-13 |
| Lanzamiento de la E1 | 2025-07-07 | 2025-07-07 |
| Radicación de la licencia de urbanización y construcción | 2025-08-04 | 2025-08-04 |
| Licencia ejecutoriada | 2025-12-01 | 2025-12-15 |
| Crédito de la E1 aprobado | 2026-01-16 | 2026-02-13 |
| Punto de equilibrio de la E1 (156 unidades) | 2026-01-30 | 2026-02-27 |
| Lanzamiento de la E2 | 2026-03-02 | 2026-03-02 |
| Acta de inicio de obra de la E1 | 2026-02-16 | 2026-03-16 |
| Punto de equilibrio de la E2 y crédito de la E2 | 2027-01-29 y 2027-01-15 | 2027-04-30 y 2027-04-16 |
| Inicio de la E2 | 2027-02-15 | 2027-05-17 |
| Certificado técnico de ocupación de la E1 | 2027-06-30 | 2027-07-30 |
| Entregas de la E1 | 2027-07-01 a 2027-09-30 | 2027-08-02 a 2027-10-29 |
| Certificado técnico de ocupación de la E2 | 2028-07-14 | 2028-10-20 |
| Entregas de la E2 | 2028-07-17 a 2028-09-29 | 2028-10-23 a 2029-01-29 |
| Liquidación de la fiducia y del crédito | 2029-01-15 a 2029-03-16 | 2029-04-16 a 2029-06-15 |
| **Acta de cierre** | **2029-03-30** | **2029-06-29** |

**Duraciones de referencia**
- Estructuración: 3 a 4 meses.
- Diseños: 4 a 6 meses.
- Licencia: el trámite legal es de 45 días hábiles prorrogables (Decreto 1077), pero en Medellín toma en la práctica 3 a 5 meses con el acta de observaciones.
- Plan parcial: 18 a 36 meses. Por eso se supone adoptado.
- Preventas hasta el punto de equilibrio: 6 a 12 meses.
- Estructura industrializada: un piso cada 7 a 10 días por bloque.
- Bloque de 8 pisos de la cimentación a la entrega: 14 a 16 meses.
- Escrituración: 3 a 5 meses por etapa.
- Garantías posteriores al proyecto: estabilidad 10 años y acabados 1 año (Ley 1480 y Decreto 1074 de 2015).

---

## 10. Estado al 2026-09-30
- **Ventas:**
  - **274 de 416 unidades (65,9 %)**: E1 196 de 208 (VIS 104 de 104, B 50 y C 42) y E2 78 de 208 (B 44 y C 34). Parqueaderos: 128.
  - Valor contratado: **100.894 M**. Recaudo de cuotas iniciales y separaciones: unos **10.265 M**.
- **Obra de la E1**, iniciada el 2026-03-16:
  - Preliminares, movimiento de tierras, cimentación y plataforma de la E1 terminados.
  - Estructura: bloque A al 75 % (piso 6 de 8) y bloque B al 30 %.
  - Mampostería del bloque A al 8 %. Urbanismo de la fase 1 al 30 %.
  - **Avance físico de la E1: 26 % real frente a 32 % planeado.**
  - Directos de la E1: valor planeado 15.048 M, valor ganado 12.226 M y costo real 12.951 M → **CPI 0,944 y SPI 0,812**.
- **Pagos y saldos:** lote y VIP pagados (18.000 M); indirectos ejecutados unos 9.050 M; saldo del crédito constructor 6.429 M (tres desembolsos desde julio de 2026); contingencia consumida 600 M.
- **Eventos:**
  - Lluvias de abril y mayo de 2026 y un deslizamiento del talud: contención adicional y 3 semanas de retraso.
  - SMMLV +23,7 % y mano de obra +14 %.
  - Tasa de política de 9,25 % a 12,25 %.
  - Ventas de Medellín −15 % y Mi Casa Ya sin asignaciones nuevas en 2026, por lo que la E2 vende más lento.
  - Punto de equilibrio de la E1 con cuatro semanas de retraso.

---

## 11. Normas y actores que hay que citar bien
**Normas**
- **Ordenamiento:** Ley 388 de 1997, Decreto 1077 de 2015 (planes parciales, licencias, expensas, VIS y VIP) y **Acuerdo 48 de 2014 (POT de Medellín)**. La revisión de mediano plazo del POT está en curso en 2026.
- **Sismorresistencia y supervisión:**
  - Ley 400 de 1997.
  - **NSR-10** (Decreto 926 de 2010, modificado por el Decreto 945 de 2017).
  - **Ley 1796 de 2016**:
    - supervisión técnica independiente para más de 2.000 m²;
    - revisión independiente de los diseños estructurales;
    - **certificado técnico de ocupación** antes de ocupar y protocolizado para escriturar;
    - amparo de perjuicios patrimoniales.
  - Decreto 1203 de 2017.
- **Propiedad horizontal:** Ley 675 de 2001.
- **Consumidor:** **Ley 1480 de 2011** (garantía legal de inmuebles nuevos).
- **Sostenibilidad:** **Resolución 0194 de 2025 de MinVivienda**, que **sustituyó a la 0549 de 2015** (Diario Oficial del 23 de abril de 2025). Sus metas de ahorro de agua y energía son obligatorias en VIS y VIP.
- **Instalaciones:** RETIE (MinEnergía; verificar si rige la Resolución 40117 de 2024), RETILAP (Res. 180540 de 2010), RITEL (Resolución CRC 5050 de 2016, título 8) y normas de diseño y conexión de EPM.
- **VIS:** Ley 2294 de 2023, art. 293 (tope de 150 SMMLV en grandes ciudades). Decreto 1469 de 2025 (SMMLV 2026).
- **Fiducia:** Circular Básica Jurídica de la Superfinanciera (CE 029 de 2014), parte II, título II, capítulo I. Allí están las preventas, los encargos y las condiciones de desembolso que la fiduciaria debe verificar (numerales 5.2.1.4 y 5.2.2.2).
- **Riesgo de lavado:** SARLAFT para la fiduciaria y SAGRILAFT (Supersociedades) para el promotor si aplica.
- **Ambiente:** Resolución 1257 de 2021 de MinAmbiente (residuos de construcción y demolición).
- **Seguridad en el trabajo:** Resolución 4272 de 2021 (trabajo en alturas).
- **Tributos de Medellín:** Acuerdo 093 de 2023, que sustituyó al 066 de 2017.

**Actores:** están listados en `brief.json → interesados`. La autoridad ambiental del suelo urbano es el **Área Metropolitana del Valle de Aburrá**; Corantioquia lo es del suelo rural.

---

## 12. Riesgos típicos (detalle en `brief.json → riesgos`)
- Velocidad de ventas y subsidios.
- Tasas de interés.
- Costos de mano de obra, acero y concreto.
- **Lluvias y estabilidad de taludes en ladera.**
- Trámites con EPM, movilidad y curaduría.
- Desistimientos.
- Cambio de los topes VIS (borrador de decreto).
- Revisión del POT.
- Seguridad en alturas y excavaciones.
- Relación con la comunidad.
- Hallazgos de la supervisión técnica.
- SARLAFT.

---

## 13. Rangos, valor elegido y confianza
| Variable | Rango encontrado | Elegido | Fuente | Confianza |
|---|---|---|---|---|
| Precio del lote bruto en el borde de expansión | 160.000-320.000 COP/m² en ofertas rurales; "300.000" según Camacol | 300.000 | Usuario; El Colombiano 2024; Fincaraíz 2026 | Media |
| Densidad, IC y altura de Desarrollo | 30-140 viv/ha; IC 0,3-0,8; 5 a 8 pisos | 100; 0,6; 8 | Acuerdo 48, art. 280; MapGIS | Alta |
| Suelo de protección + afectación vial | 10-30 % del bruto | 22 % | Supuesto con base en el art. 313 y los retiros | Media |
| Cesión de espacio público | 18 % del bruto o 5 m²/hab, el mayor | 18 % | Acuerdo 48, art. 308 | Alta |
| Habitantes por vivienda | 2,8-3,5 | 2,9 | ECV 2025 (muestra), DANE ECV 2025 | Media |
| Precio VIS por m² | 4,3-5,5 M | 5,08 M | Galería (5,19), listados | Media-alta |
| Precio No VIS por m², estrato 3 occidente | 5,8-7,6 M | 6,5-6,6 M promedio | Ciencuadras 2026, IPVN | Media |
| Costo directo por m² construido de torre | 1,9-2,6 M (2026) | 2,20 M | Construdata 2025 + ICOCED | Media |
| Directos / ventas | 52-62 % | 58,3 % | Práctica del sector; modelo | Media |
| Indirectos / ventas | 11-16 % | 13,8 % | Práctica del sector | Media |
| Financieros / ventas | 3-8 % | 4,3 % (pronóstico 5,3 %) | Portafolio 2025 | Media |
| Lote / ventas | 3-15 % según producto | 9,25 % | El Colombiano 2025 (H3) | Media-alta |
| Margen antes de impuestos | 8-15 % | 12,45 % (pronóstico 10,1 %) | Portafolio 2025; práctica | Media |
| Punto de equilibrio | 60-90 % | 75 % | Portafolio (Camacol); Ciencuadras | Media |
| Velocidad de ventas | 8-25 unidades/mes por proyecto | 18 (E2 real 11) | Galería, Camacol Antioquia | Media-baja |
| Spread del crédito constructor | IBR + 3,5 a 6 | IBR + 4,5 | Camacol 13,47 % (2026); bancos | Media-baja |
| Tasa de política del BanRep (oct-2026) | — | 12,25 % | BanRep | Alta |
| SMMLV 2026 y tope VIS | — | 1.750.905; 262.635.750 | Decreto 1469 de 2025; Ley 2294 | Alta |
| ICOCED 2026 | — | +6,59 % total; mano de obra +14,06 % | DANE, junio de 2026 | Alta |

**Pendientes de verificar.** Cuestiones de fuente:
- tabla de Construdata 217 o 218 para Medellín (de pago);
- factor "m" de las expensas de Medellín;
- tarifa de ICA vigente en el Acuerdo 093 de 2023;
- número de resolución del RETIE vigente;
- circular del DAP con los habitantes por vivienda de 2026;
- estado del borrador de decreto VIS.

Cuestión de método: el cálculo de la obligación VIP en el ejemplo usa una sola UAU y un valor del suelo implícito. En un plan parcial real, el reparto lo define el decreto de adopción.

---

## 14. Fuentes
**Norma y ordenamiento (Medellín)**
- Acuerdo 48 de 2014, POT de Medellín (normograma Astrea): https://www.medellin.gov.co/normograma/docs/astrea/docs/a_conmed_0048_2014.htm
- Gaceta 4267, texto oficial del Acuerdo 48: https://www.medellin.gov.co/es/wp-content/uploads/2022/10/Gaceta-4267-Acuerdo-48-2014-POT.pdf
- MapGIS, Densidad habitacional máxima (VM_24) con la tabla de polígonos D y DE: https://www.medellin.gov.co/servidormapas/rest/services/ordenamiento_ter/VM_24_Densidad_Habitacional_Max/MapServer
- Decreto 397 de 2007, plan parcial Altos de Calasanz: https://medellin.gov.co/es/wp-content/uploads/2024/11/Decreto-0397-de-2007.pdf
- Documento técnico del plan parcial Altos de Calasanz: https://www.medellin.gov.co/es/wp-content/uploads/2024/11/DOCUMENTO-TECNICO-PLAN-PARCIAL-ALTOS-DE-CALASANZ.pdf
- Resolución de liquidación de obligaciones urbanísticas (2025), con valores de zonas geoeconómicas: https://www.medellin.gov.co/es/wp-content/uploads/2025/11/06_00-RL-EQV-202550029453.pdf
- Acuerdo 066 de 2017, Estatuto Tributario de Medellín (delineación e ICA): https://www.ceta.org.co/html/estatutos_municipales/Acuerdo%20066%20de%202017%20compilado.pdf
- Normatividad tributaria de Medellín (Acuerdo 093 de 2023): https://www.medellin.gov.co/es/secretaria-de-hacienda/normatividad-tributaria/
- Centro documental de la Encuesta de Calidad de Vida: https://www.medellin.gov.co/es/centro-documental/encuesta-calidad-de-vida/

**Mercado**
- El Colombiano (2 de junio de 2024), "En Medellín hay zonas donde la vivienda nueva es incomprable" (suelo a $300.000/m², tasas de crédito constructor): https://www.elcolombiano.com/negocios/cuanto-vale-el-metro-cuadrado-de-vivienda-en-medellin-IH24671999
- El Colombiano (19 de octubre de 2025), costo de la tierra en el precio de la vivienda (H3 Constructora): https://www.elcolombiano.com/negocios/costo-de-la-tierra-en-el-precio-de-una-casa-en-medellin-HL30082764
- Ciencuadras, Informe I semestre 2026 (datos de La Galería Inmobiliaria): https://www.ciencuadras.com/blog/wp-content/uploads/2026/08/Informe-I-semestre-2026.pdf
- Ciencuadras, proyectos de vivienda nueva en Medellín: https://www.ciencuadras.com/proyectos-vivienda-nueva/medellin/san-antonio-de-prado
- Luna del Cerro (Robledo): https://www.ciencuadras.com/proyecto-de-vivienda/constructora-capital-bogota-sas-luna-del-cerro-medellin-2002
- Ciudadela del Parque (Itagüí): https://www.ciencuadras.com/proyecto-de-vivienda/arquitectura-y-concreto-sas-ciudadela-del-parque-medellin-2389
- Camacol Antioquia, ventas del I semestre de 2025: https://www.camacolantioquia.org.co/2025/07/16/ventas-de-vivienda-en-antioquia-crecen-el-301-en-el-primer-semestre-2025-continua-la-recuperacion-del-sector-de-la-construccion-en-la-region/
- DANE, IPVN II trimestre 2026: https://www.dane.gov.co/files/operaciones/IPVN/bol-IPVN-IItrim2026.pdf
- Portafolio (19 de diciembre de 2025), Constructora Capital, márgenes y costos financieros: https://www.portafolio.co/mis-finanzas/vivienda/constructora-capital-perdio-hasta-8-de-rentabilidad-por-inflacion-y-tasas-pero-este-ano-empezo-a-recuperarla-484989
- Portafolio, punto de equilibrio según Camacol: https://www.portafolio.co/economia/infraestructura/asi-sienten-los-constructores-la-desaceleracion-en-su-negocio-577545
- Subsidios vigentes en 2026 (Portafolio): https://www.portafolio.co/mis-finanzas/vivienda/subsidios-de-vivienda-vigentes-en-2026-cajas-de-compensacion-y-programas-locales-tras-mi-casa-ya-485814
- Casa Milagro (El Universal, julio de 2026): https://www.eluniversal.com.co/colombia/2026/07/09/casa-milagro-asi-sera-el-programa-que-reemplazara-a-mi-casa-ya/

**Topes VIS y SMMLV**
- Consejo de Estado y SMMLV 2026 (Vanguardia, 17 de julio de 2026): https://www.vanguardia.com/colombia/2026/07/17/consejo-de-estado-revoco-medida-que-suspendia-provisionalmente-decreto-de-salario-minimo-2026/
- Decretos 1469 y 1470 de 2025 (Consultorsalud): https://consultorsalud.com/?p=328046
- Topes VIS y VIP 2026 (Blu Radio): https://www.bluradio.com/economia/finanzas-personales/vivienda-vis-y-vip-en-2026-este-es-el-nuevo-valor-con-el-aumento-del-salario-minimo-so35
- Borrador de decreto VIS en pesos (El Colombiano, 20 de febrero de 2026): https://www.elcolombiano.com/negocios/precio-vivienda-vis-vip-desindexacion-salario-minimo-2026-NE33738454
- Borrador de decreto (La República): https://www.larepublica.co/economia/minvivienda-publica-borrador-de-decreto-que-fija-precios-de-vivienda-vis-y-vip-en-pesos-4331992

**Costos**
- DANE, ICOCED junio de 2026: https://www.dane.gov.co/files/operaciones/ICOCED/bol-ICOCED-jun2026.pdf
- Universidad Distrital (2024), presupuesto por capítulos de un proyecto VIS industrializado: https://repository.udistrital.edu.co/server/api/core/bitstreams/1affb084-7287-4d47-8ba9-9a3e0338fb94/content
- Construdata, ediciones y definiciones (costo directo y total sobre área construida bruta): https://www.construdata.com/ y https://librosdigitales.legis.co/library/publication/revista-construdata-217-ref-132592
- Expensas de curaduría, Decreto 1890 de 2021: https://www.minvivienda.gov.co/sites/default/files/normativa/decreto-1890-del-30-de-diciembre-de-2021.pdf
- Tarifas notariales 2026 (Camacol, Informe Jurídico 1014): https://camacol.co/sites/default/files/descargables/INFORME%20JURIDICO%201014.pdf

**Tasas y financiación**
- Banco de la República, decisión de septiembre de 2026 (12,25 %): https://www.banrep.gov.co/en/news/board-directors/september-2026
- Alza a 10,25 % (Valora Analitik, enero de 2026): https://www.valoraanalitik.com/ahora-banrep-colombia-sube-las-tasas-de-interes-por-primera-vez-en-mas-de-dos-anos-llegan-al-1025/
- Tasa mantenida en 12,0 % (Infobae, 31 de julio de 2026): https://www.infobae.com/colombia/2026/07/31/el-banco-de-la-republica-mantuvo-la-tasa-de-interes-en-120-ante-expectativas-de-aumento-de-la-inflacion/
- Swap IBR 3M: https://www.bluegamma.io/swap-rates/cop-swap-rates/3-month-ibr-swap-rate
- Fin de la DTF (Bancolombia, septiembre de 2026): https://blog.bancolombia.com/educacion-financiera/eliminacion-tasa-dtf-ibr/
- Bancolombia, crédito constructor: https://www.bancolombia.com/empresas/productos-servicios/creditos/constructor/profesional
- Superfinanciera, fiducia y proyectos inmobiliarios: https://www.superfinanciera.gov.co/publicaciones/10089703
- Concepto de la Superfinanciera sobre preventas (CE 029 de 2014): https://www.ambitojuridico.com/sites/default/files/BancoMedios/Archivos/cpto-84525-17.pdf

**Normas técnicas**
- Resolución 0194 de 2025, construcción sostenible: https://normas.cra.gov.co/gestor/docs/resolucion_minviviendact_0194_2025.htm
- Decreto 945 de 2017 (NSR-10, supervisión técnica): https://www.ambitojuridico.com/sites/default/files/BancoMedios/Archivos/d-0945-17%28minvivenda%29.pdf
- Resumen de la Ley 1796 de 2016 (Universidad del Rosario): https://eventos.urosario.edu.co/sites/default/files/2022-10/resumen_ley_1796_2016_0.pdf
- Amenaza sísmica de Medellín (Valora Analitik): https://www.valoraanalitik.com/?p=245333
