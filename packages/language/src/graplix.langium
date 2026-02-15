grammar Graplix

entry GraplixDocument:
    types+=GraplixTypeDeclaration*;

terminal ID:
    /[a-zA-Z_][a-zA-Z0-9_]*/;

GraplixTypeDeclaration:
    'type' name=ID relations=GraplixRelations?;

GraplixRelations:
    'relations' relations+=GraplixRelationDefinition+;

GraplixRelationDefinition:
    'define' name=ID ':' expression=GraplixRelationExpression;

GraplixRelationExpression:
    terms+=GraplixRelationTerm ('or' terms+=GraplixRelationTerm)*;

GraplixRelationTerm:
    GraplixDirectTypes | GraplixRelationFrom;

GraplixDirectTypes:
    '[' targets+=ID (',' targets+=ID)* ']';

GraplixRelationFrom:
    relation=ID ( 'from' source=ID )?;

hidden terminal WS:
    /\s+/;
