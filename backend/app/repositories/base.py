from typing import Generic, Type, TypeVar, Optional, List, Any
from sqlalchemy.orm import Session
from app.models.base import Base

ModelType = TypeVar("ModelType", bound=Base)

class BaseRepository(Generic[ModelType]):
    """
    Generic Repository pattern base class providing common CRUD operations
    """
    def __init__(self, model: Type[ModelType]):
        self.model = model

    def get(self, db: Session, id: Any) -> Optional[ModelType]:
        """
        Retrieves a single active record by primary key UUID
        """
        return db.query(self.model).filter(
            self.model.id == id,
            self.model.is_deleted == False
        ).first()

    def get_multi(self, db: Session, *, skip: int = 0, limit: int = 100) -> List[ModelType]:
        """
        Retrieves a paginated list of active records
        """
        return db.query(self.model).filter(
            self.model.is_deleted == False
        ).offset(skip).limit(limit).all()

    def create(self, db: Session, *, obj_in: Any) -> ModelType:
        """
        Adds a new record to the database session
        """
        # Convert schema object to dict if it's a Pydantic model
        if hasattr(obj_in, "dict"):
            obj_data = obj_in.dict()
        else:
            obj_data = dict(obj_in)
            
        db_obj = self.model(**obj_data)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(self, db: Session, *, db_obj: ModelType, obj_in: Any) -> ModelType:
        """
        Updates fields of an existing model instance
        """
        if hasattr(obj_in, "dict"):
            update_data = obj_in.dict(exclude_unset=True)
        else:
            update_data = dict(obj_in)
            
        # Update version number to support optimistic locking checks
        if hasattr(db_obj, "version_number"):
            db_obj.version_number += 1
            
        for field in update_data:
            if hasattr(db_obj, field):
                setattr(db_obj, field, update_data[field])
                
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def soft_delete(self, db: Session, *, id: Any) -> Optional[ModelType]:
        """
        Marks a record as deleted without deleting it from the table
        """
        db_obj = self.get(db, id)
        if db_obj:
            db_obj.is_deleted = True
            db.add(db_obj)
            db.commit()
            db.refresh(db_obj)
        return db_obj

    def hard_delete(self, db: Session, *, id: Any) -> bool:
        """
        Deletes a record permanently from the database table
        """
        db_obj = db.query(self.model).filter(self.model.id == id).first()
        if db_obj:
            db.delete(db_obj)
            db.commit()
            return True
        return False
