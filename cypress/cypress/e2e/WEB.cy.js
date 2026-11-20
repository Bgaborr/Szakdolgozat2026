describe("Statisztikák Oldal Tesztelése", () => {
  beforeEach(() => {
    cy.visit("http://localhost");
    cy.get("#login > .nav-label").click();
    cy.url().should("include", "/login");

    cy.get('input[type="email"]').clear().type("admin@test.hu");
    cy.get('input[type="password"]').clear().type("a");
    cy.get('button[type="submit"]').click();

    cy.url().should("include", "/dashboard");
  });

  it("Sikeresen betölti a statisztika oldalt és megjeleníti a főcímet", () => {
    cy.visit("http://localhost/stat");
    cy.get(".page-header h2").should("contain.text", "Statisztikák");
  });

  it("Megjeleníti a Mozdonyok, Motorvonatok és Személykocsik szekciókat", () => {
    cy.visit("http://localhost/stat");
    cy.get(".stat-page > :nth-child(4)");
    cy.get("h3.section-title")
      .eq(0)
      .should(
        "contain.text",
        "📅 Járműállomány fővizsga-állapota (naptári esedékesség alapján)",
      );
    cy.get("h3.section-title")
      .eq(1)
      .should("contain.text", "🚂 Mozdony Statisztikák");
    cy.get("h3.section-title")
      .eq(2)
      .should("contain.text", "🚆 Motorvonat Statisztikák");
    cy.get("h3.section-title")
      .eq(3)
      .should("contain.text", "🚋 Személykocsi Statisztikák");
  });

  it("Betölti a diagramokat (canvas elemeket)", () => {
    cy.visit("http://localhost/stat");
    cy.get(
      ":nth-child(2) > .charts-grid > .chart-card > .chart-wrapper > canvas",
    ).should("have.length", 1);
  });

  it("Sikeresen betölti a szójegyzék oldalt és megjeleníti a főcímet", () => {
    cy.visit("http://localhost/glossary");
    cy.get(".page-header h2").should("contain.text", "Vasúti Fogalomtár");
    cy.get(".btn-primary").should("contain.text", "Új fogalom").click();
    cy.get('[name="category"]').clear().type("Forgalom");
    cy.get('[name="term"]').clear().type("Forgalomirányító");
    cy.get('[name="definition"]')
      .clear()
      .type("A forgalom irányításáért felelős személy.");
    cy.get(".modal-footer > .btn-primary").click();
    cy.wait(1000);
    cy.get(
      ":nth-child(3) > .term-list > :nth-child(2) > .term-row > .term-actions > .btn-icon--danger",
    ).click();
  });
});
