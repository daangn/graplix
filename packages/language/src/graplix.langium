grammar Graplix

entry GraplixDocument:
    statements+=GraplixStatement*;

GraplixStatement:
    value=IDENTIFIER;

terminal IDENTIFIER:
    /[a-zA-Z_][a-zA-Z0-9_]*/;

hidden terminal WS:
    /\s+/;
