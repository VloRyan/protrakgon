package api

import (
	"errors"
	"reflect"
	"strconv"
	"strings"

	"github.com/vloryan/go-libs/reflectx"
	"github.com/vloryan/go-libs/sqlx/filter"
	"github.com/vloryan/go-libs/sqlx/pagination"
	"github.com/vloryan/go-libs/sqlx/statement"
	"github.com/vloryan/protrakgon/internal/app/server/db"
)

type Entity interface {
	GetID() int
	SetID(id int)
}
type FilterWhere struct {
	Conditions []string
	Params     map[string]any
	Joins      []string
}
type Filter interface {
	ToCriteria() filter.Criteria
}
type IDHelper interface {
	GetID() int
	SetID(id int)
	HasID() bool
}
type idHelper[T any] struct {
	idField reflect.Value
}

func (i idHelper[T]) GetID() int {
	return int(i.idField.Int())
}

func (i idHelper[T]) SetID(id int) {
	i.idField.SetInt(int64(id))
}

func (i idHelper[T]) HasID() bool {
	return i.idField.IsValid()
}

func newIdHelper[T any](object T) IDHelper {
	idField := reflectx.FindFieldFunc(object, func(field reflect.StructField) bool {
		return strings.EqualFold(field.Name, "id")
	})
	return &idHelper[T]{idField: idField}
}

type CRUDRepository[T any, F Filter] interface {
	Save(tx db.Transaction, item T) error
	GetByID(tx db.Transaction, id int) (T, error)
	GetAll(tx db.Transaction, page *pagination.Page, filter F) ([]T, error)
	Delete(tx db.Transaction, id int) error

	WithJoin(tableName string, statement RepositoryJoinParams) CRUDRepository[T, F]
}
type RepositoryParams struct {
	TableName   string
	IDColumn    string
	ColumnNames []string
	Joins       []statement.TableJoinDefinition
}

type RepositoryJoinParams struct {
	TableName       string
	IDColumn        string
	ColumnNames     []string
	ForeignIDColumn string
}

func NewCRUDRepository[T any, F Filter](params RepositoryParams) CRUDRepository[T, F] {
	var item T
	t := reflectx.TypeOf(item, true)
	var columnExprs []statement.ColumnExpression
	for _, columnName := range params.ColumnNames {
		paramName, err := extractParamName(columnName, t)
		if err != nil {
			panic(err)
		}
		columnExprs = append(columnExprs, statement.ColumnExpression{
			Name:   columnName,
			Alias:  paramName,
			Source: statement.Field,
		})
	}
	idParamName, err := extractParamName(params.IDColumn, t)
	if err != nil {
		panic(err)
	}
	columnExprsWithId := append([]statement.ColumnExpression{{
		Name:   params.IDColumn,
		Alias:  idParamName,
		Source: statement.Field,
	}}, columnExprs...)

	insertStatement := statement.NewInsert(params.TableName).
		WithFields(columnExprs...).
		SQL()

	updateStatement := statement.NewUpdate(params.TableName).
		WithFields(columnExprs...).
		Where(params.IDColumn + " = :" + idParamName).
		SQL()

	selectStatement := statement.NewSelect(columnExprsWithId...).
		From(params.TableName).
		Joins(params.Joins...).
		SQL()

	selectByIDStatement := statement.NewSelect(columnExprsWithId...).
		From(params.TableName).
		Joins(params.Joins...).
		Where(params.TableName + "." + params.IDColumn + " = :" + idParamName).
		SQL()

	deleteStatement := statement.NewDelete(params.TableName).
		Where(params.TableName + "." + params.IDColumn + " = :" + idParamName).
		SQL()

	return &repo[T, F]{
		tableName:      params.TableName,
		statements:     []string{insertStatement, updateStatement, selectByIDStatement, selectStatement, deleteStatement},
		joinStatements: make(map[string]RepositoryJoinParams),
		idParamName:    idParamName,
	}
}

type statementType int

const (
	statementInsert      statementType = iota
	statementUpdate      statementType = iota
	statementSelectByID  statementType = iota
	statementSelectWhere statementType = iota
	statementDelete      statementType = iota
)

type repo[T any, F Filter] struct {
	tableName      string
	statements     []string
	joinStatements map[string]RepositoryJoinParams
	idParamName    string
}

func (r *repo[T, F]) Save(tx db.Transaction, item T) error {
	idHlp := newIdHelper(item)
	if idHlp.GetID() == 0 {
		stmt := r.statements[statementInsert]

		result, err := tx.Exec(stmt, item)
		if err != nil {
			return err
		}
		id, err := result.LastInsertId()
		if err != nil {
			return err
		}
		idHlp.SetID(int(id))
		return nil
	} else {
		stmt := r.statements[statementUpdate]

		result, err := tx.Exec(stmt, item)
		if err != nil {
			return err
		}
		affected, err := result.RowsAffected()
		if err != nil {
			return err
		}
		if affected == 0 {
			return errors.New("update failed: 0 rows affected")
		}
	}
	return nil
}

func (r *repo[T, F]) GetByID(tx db.Transaction, id int) (T, error) {
	var nilEntity T
	item := r.createEntity()
	stmt := r.statements[statementSelectByID]

	if err := tx.Select(item, stmt, map[string]any{r.idParamName: id}); err != nil {
		return nilEntity, err
	}
	idHlp := newIdHelper(item)
	if idHlp.GetID() == 0 {
		return nilEntity, nil
	}
	return item, nil
}

func (r *repo[T, F]) GetAll(tx db.Transaction, page *pagination.Page, f F) ([]T, error) {
	items := make([]T, 0, 10)
	stmt := r.statements[statementSelectWhere]

	where := f.ToCriteria().ToWhere()

	if !where.Empty() {
		stmt += "\n" + where.Clause()
	}
	countStmt := "SELECT COUNT(*) " + stmt[strings.Index(stmt, "FROM"):]
	if err := tx.Select(page, countStmt, where.Parameter); err != nil {
		return nil, err
	}

	if len(page.Sort) > 0 {
		orderArgs, err := r.generateOrderArgs(page.Sort)
		if err != nil {
			return nil, err
		}
		if len(orderArgs) > 0 {
			stmt += "\nORDER BY " + strings.Join(orderArgs, " AND ")
		}
	}
	selectParams := make(map[string]any)
	for k, v := range where.Parameter {
		selectParams[k] = v
	}

	if page.Limit != -1 {
		stmt += "\nLIMIT :limit"
		selectParams["limit"] = page.Limit
		if page.Offset != 0 {
			stmt += "\nOFFSET :offset"
			selectParams["offset"] = page.Offset * page.Limit
		}
	}

	if err := tx.Select(&items, stmt, selectParams); err != nil {
		return nil, err
	}

	return items, nil
}

func (r *repo[T, F]) generateOrderArgs(sorts []string) ([]string, error) {
	var orderArgs []string
	var item T
	t := reflectx.TypeOf(item, true)
	for _, sort := range sorts {
		var dir string
		var fieldName string
		if strings.HasPrefix(sort, "-") {
			dir = " DESC"
			sort = sort[1:]
		}
		for i := 0; i < t.NumField(); i++ {
			field := t.Field(i)
			jsonTag := reflectx.Tag(field, "json")
			if strings.EqualFold(sort, field.Name) || strings.EqualFold(sort, jsonTag.Value) {
				dbTag := reflectx.Tag(field, "db")
				if dbTag.Value != "" {
					fieldName = dbTag.Value
				} else {
					fieldName = sort
				}
			}
		}
		if fieldName == "" {
			return nil, errors.New("field " + sort + " not found")
		}
		orderArgs = append(orderArgs, fieldName+dir)
	}
	return orderArgs, nil
}

func (r *repo[T, F]) Delete(tx db.Transaction, id int) error {
	stmt := r.statements[statementDelete]

	result, err := tx.Exec(stmt, map[string]interface{}{r.idParamName: id})
	if err != nil {
		return err
	}
	affected, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if affected != 1 {
		return errors.New("delete failed: " + strconv.Itoa(int(affected)) + " rows affected")
	}
	return err
}

func (r *repo[T, F]) WithJoin(tableName string, params RepositoryJoinParams) CRUDRepository[T, F] {
	r.joinStatements[tableName] = params
	return r
}

func (r *repo[T, F]) createEntity() T {
	var item T
	t := reflect.TypeOf(item)
	if t.Kind() != reflect.Ptr {
		return item
	}
	e := reflect.New(t.Elem())
	return e.Interface().(T)
}

func extractParamNames(columns []string, item any) ([]string, error) {
	var columnParams []string
	t := reflectx.TypeOf(item, true)
	for _, column := range columns {
		name, err := extractParamName(column, t)
		if err != nil {
			return nil, err
		}
		columnParams = append(columnParams, name)
	}
	return columnParams, nil
}

func extractParamName(column string, t reflect.Type) (string, error) {
	for i := 0; i < t.NumField(); i++ {
		field := t.Field(i)
		dbTag := reflectx.Tag(field, "db")
		if dbTag.Value == "-" {
			continue
		}
		if strings.EqualFold(column, field.Name) || strings.EqualFold(column, dbTag.Value) {
			return field.Name, nil
		}
		fieldInstance := reflect.New(reflectx.DeRef(field.Type)).Interface()
		idHlp := newIdHelper(fieldInstance)
		if idHlp.HasID() && strings.HasSuffix(strings.ToLower(column), "_id") {
			paramName := column[0 : len(column)-len("_id")]
			if strings.EqualFold(paramName, field.Name) || strings.EqualFold(paramName, dbTag.Value) {
				return field.Name + ".id", nil
			}
		}
	}
	return "", errors.New("property for column '" + column + "' not found")
}
