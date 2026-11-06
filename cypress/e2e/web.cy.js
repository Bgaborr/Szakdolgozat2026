describe("Statisztikák Oldal Tesztelése", () => {
  // A beforeEach MINDEN teszt előtt lefut. Itt végezzük el az előkészületeket (login).
  beforeEach(() => {
    cy.visit("http://localhost");
    cy.get("#login > .nav-label").click();
    cy.url().should("include", "/login");

    // Törékeny szelektorok lecserélve stabilakra (feltételezem, hogy email és password a típusuk)
    cy.get('input[type="email"]').clear().type("admin@test.hu");
    cy.get('input[type="password"]').clear().type("password2026");
    cy.get('button[type="submit"]').click();

    // Megvárjuk, amíg betölt a dashboard, majd átmegyünk a statisztikákra
    cy.url().should("include", "/dashboard");
    cy.visit("http://localhost/stat");
  });

  it("Sikeresen betölti a statisztika oldalt és megjeleníti a főcímet", () => {
    // Itt már be vagyunk jelentkezve és a /stat oldalon vagyunk!
    cy.get(".page-header h2").should("contain.text", "Statisztikák");
  });

  it("Megjeleníti a Mozdonyok, Motorvonatok és Személykocsik szekciókat", () => {
    cy.get("h3.section-title").should("have.length", 3);

    // Itt is egységesítettem a szelektorokat
    cy.get("h3.section-title")
      .eq(0)
      .should("contain.text", "Mozdony Statisztikák");
    cy.get("h3.section-title")
      .eq(1)
      .should("contain.text", "Motorvonat Statisztikák");
    cy.get("h3.section-title")
      .eq(2)
      .should("contain.text", "Személykocsi Statisztikák");
  });

  it("Betölti a diagramokat (canvas elemeket)", () => {
    cy.get("canvas").should("have.length", 8);
  });
});
